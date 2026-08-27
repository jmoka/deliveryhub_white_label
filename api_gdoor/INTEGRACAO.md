# Integração api_gdoor ↔ server_delivery ↔ GDOOR SLIM

**Status atual: pareamento tipo "agente" (mesmo padrão do print-agent) implementado e testado de ponta a ponta contra o Firebird real do GDOOR SLIM local.** Este documento substitui a versão anterior (que descrevia um modelo de webhook "push" — abandonado, ver seção "Por que não é mais push" abaixo).

## Arquitetura

`api_gdoor` roda como **agente local**, na mesma máquina/rede do GDOOR SLIM — igual o `print-agent` (`DeliveryHubAgente.exe`) já faz pra impressão. Ele **puxa** (polling) os pedidos pendentes do `server_delivery`, nunca o contrário:

1. Dono gera um token de conexão em `/restaurante/config` (painel, botão "Gerar token de conexão", componente `GdoorAgentePanel`).
2. Token colado na GUI de pareamento (`parear_gui.py`, botão "Conectar") — grava em `local_config.json` (`%APPDATA%\DeliveryHubAgenteGdoor`), **não** em `.env` (ver seção "Configuração" abaixo — mesmo padrão do print-agent, pensado pra funcionar numa instalação empacotada sem nenhum arquivo pra editar na mão).
3. `app/poller.py` roda em background (thread, iniciado no `startup` do FastAPI), a cada `POLLER_INTERVALO_SEG` (padrão 5s):
   - `POST /agente-gdoor/cnpj` — reporta o CNPJ lido de `EMITENTE.CNPJ` no Firebird local (não existe campo "SERIAL" dedicado no GDOOR — CNPJ é o identificador usado).
   - `GET /agente-gdoor/jobs/pendentes` — só devolve trabalho se o CNPJ reportado bater com o `gdoor_cnpj_esperado` cadastrado no painel (`bloqueado: true` se não bater — trava de segurança extra além do token).
   - Pra cada job: grava a pré-venda no Firebird (`firebird_client.criar_pre_venda`) e reporta `POST /agente-gdoor/jobs/:id/concluido` (ou `/erro`).
4. `server_delivery` nunca chama o `api_gdoor` diretamente — quando um pedido vira `delivered` (`PedidosService.atualizarStatus`), só faz `INSERT` numa fila (`gdoor_jobs`), que o poller consome.
5. A cada ~12 ciclos (~1x/min com `POLLER_INTERVALO_SEG=5`), o poller também reporta o catálogo `ESTOQUE` do GDOOR local via `POST /agente-gdoor/estoque`, cacheado em `gdoor_estoque_cache` — alimenta o seletor de código no painel (o agente nunca decide mapeamento sozinho).

## Configuração — sem `.env` em produção

`api_gdoor` não depende de `.env` pra rodar numa instalação real, pelo mesmo motivo do `print-agent`: quando distribuído pra máquina de um restaurante, não tem como colocar um arquivo na pasta de instalação de cada cliente (nem editar um `server_delivery/.env` — esse é o `.env` do **backend na nuvem**, compartilhado por todos os restaurantes; não tem como guardar lá o token/CNPJ de uma instalação específica, e a nuvem não alcança a máquina do restaurante pra "empurrar" config de volta, mesmo motivo do polling).

O padrão é o mesmo do `print-agent/config.py`:
- **URL do backend**: fixa no código (`app/local_config.py:DEFAULT_BACKEND_URL`, aponta pra produção). Só muda via `.env`/`local_config.json` em caso raro.
- **Token de pareamento** e demais dados que variam por instalação (conexão Firebird, se o GDOOR não estiver no caminho padrão): ficam em `local_config.json` (`%APPDATA%\DeliveryHubAgenteGdoor`), criado/editado pela GUI de pareamento (`parear_gui.py` → `local_config.definir_token()`) — nunca precisa editar arquivo na mão. Tem defaults pro caminho/porta/usuário padrão do GDOOR SLIM, então a maioria das instalações funciona sem editar nada.
- **`.env`** (`app/config.py`) continua existindo só como camada de conveniência pra desenvolvimento nesta máquina — se existir, tem prioridade sobre `local_config.json`. Uma instalação empacotada (sem esse arquivo) roda só com `local_config.json` + defaults.

## Por que não é mais push

A primeira versão fazia `server_delivery` chamar `POST {API_GDOOR_URL}/pedidos` direto. Funciona em dev (tudo na mesma máquina), mas **quebra em produção**: `server_delivery` roda na nuvem (VPS/EasyPanel) e não alcança uma máquina de restaurante atrás de NAT/roteador doméstico sem port-forward. Polling (agente puxa) resolve isso sem exigir nenhuma configuração de rede do lado do restaurante — mesma razão de design do print-agent.

## Mecanismo GDOOR (engenharia reversa, não documentação oficial)

Pré-venda pro PDV NFC-e = linha em `VENDAS` com `MODELO='PV'`, `PROCESSADA=1`, `CANCELADA=0`, `IMPORTADO=0`. Itens em `ITEVENDAS` (FK `ID_VENDAS`). Cliente via `PDV_CLIENTE` (`ID_VENDA`, `CPFCNPJ`, `NOME`). Numeração: `NOTA = GEN_ID(GEN_VENDAS_ID,1)`. `SERIE`/`LOJA`/`CAIXA` fixos via `.env` (`VENDAS_SERIE`, `VENDAS_LOJA`, `VENDAS_CAIXA`). Produto precisa existir em `ESTOQUE.CODIGO` (cadastro fiscal feito pela tela do GDOOR, não por SQL). **Homologar com suporte GDOOR antes de produção real** — isso ainda não foi feito.

**Arquitetura local desta máquina de dev**: Firebird 32-bit — `fbclient.dll` confirmado 32-bit (header PE `0x14c`). Rodar com `py -3.13-32` (venv dedicado em `.venv/`), não a Python 64-bit padrão do PATH. `fbclient.dll` já registrado em `C:\Windows\SysWOW64`, resolvido automaticamente por processo 32-bit.

## Mapeamento produto → código GDOOR

Chave é `product_id` (id numérico do Supabase — `products` não tem SKU próprio). **Cadastrado pelo dono direto no painel** (`/restaurante/config`, aba de mapeamento de produtos GDOOR), gravado em `gdoor_produto_mapeamento` (Supabase). O seletor de código usa o catálogo `ESTOQUE` espelhado pelo agente (`gdoor_estoque_cache`).

Ao criar o job (`GdoorService.criarJob`), o `server_delivery` já resolve `product_id → codigo_gdoor` e grava direto no payload — o agente só executa o que o job mandar, sem mapeamento local nenhum. Item sem mapeamento vai com `codigo_gdoor: null`; o agente detecta e reporta `POST /agente-gdoor/jobs/:id/erro` pedindo pra mapear no painel (job fica travado em `erro` até o dono mapear e o pedido ser reenviado manualmente — sem retry automático).

O `POST /mapeamento` local do `api_gdoor` (sqlite, `app/mapping.py`) continua existindo só pro webhook manual `/pedidos` (teste via curl) — não faz parte do fluxo principal.

## Endpoints

**`server_delivery` (lado dono, painel — `RestaurantOwnerGuard`)**: `POST restaurante/gdoor/gerar-token`, `GET restaurante/gdoor/status`, `PATCH restaurante/gdoor/cnpj-esperado`, `GET restaurante/gdoor/estoque`, `GET restaurante/gdoor/mapeamento`, `PUT restaurante/gdoor/mapeamento/:productId`.

**`server_delivery` (lado agente — `AgenteGdoorGuard`, header `x-gdoor-agente-token`)**: `GET agente-gdoor/me`, `POST agente-gdoor/cnpj`, `POST agente-gdoor/estoque`, `GET agente-gdoor/jobs/pendentes`, `POST agente-gdoor/jobs/:id/concluido`, `POST agente-gdoor/jobs/:id/erro`.

**`api_gdoor`**: `POST /mapeamento`, `GET /mapeamento`, `GET /saude` — legado, só teste manual. `POST /pedidos` idem, não é mais o caminho principal (ver `app/main.py`).

## O que falta

- [ ] Homologação formal com suporte GDOOR (mecanismo é engenharia reversa).
- [ ] Retry automático de job em `erro` depois que o produto for mapeado (hoje precisa reenviar manualmente).
- [ ] Empacotar `api_gdoor` como executável instalável (PyInstaller, ex.) — hoje roda via `uvicorn` manual, sem instalador tipo o do print-agent.
- [ ] Revogação/expiração de token — hoje só sobrescreve ao regenerar, sem TTL (mesmo nível do print-agent hoje).
