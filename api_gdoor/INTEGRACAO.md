# Integração api_gdoor ↔ server_delivery ↔ GDOOR SLIM

**Status atual: pareamento tipo "agente" (mesmo padrão do print-agent) implementado e testado de ponta a ponta contra o Firebird real do GDOOR SLIM local.** Este documento substitui a versão anterior (que descrevia um modelo de webhook "push" — abandonado, ver seção "Por que não é mais push" abaixo).

## Arquitetura

`api_gdoor` roda como **agente local**, na mesma máquina/rede do GDOOR SLIM — igual o `print-agent` (`DeliveryHubAgente.exe`) já faz pra impressão. Ele **puxa** (polling) os pedidos pendentes do `server_delivery`, nunca o contrário:

1. Dono gera um token de conexão em `/restaurante/config` (painel, botão "Gerar token de conexão", componente `GdoorAgentePanel`).
2. Token colado no `.env` do `api_gdoor` (`GDOOR_AGENTE_TOKEN`).
3. `app/poller.py` roda em background (thread, iniciado no `startup` do FastAPI), a cada `POLLER_INTERVALO_SEG` (padrão 5s):
   - `POST /agente-gdoor/cnpj` — reporta o CNPJ lido de `EMITENTE.CNPJ` no Firebird local (não existe campo "SERIAL" dedicado no GDOOR — CNPJ é o identificador usado).
   - `GET /agente-gdoor/jobs/pendentes` — só devolve trabalho se o CNPJ reportado bater com o `gdoor_cnpj_esperado` cadastrado no painel (`bloqueado: true` se não bater — trava de segurança extra além do token).
   - Pra cada job: grava a pré-venda no Firebird (`firebird_client.criar_pre_venda`) e reporta `POST /agente-gdoor/jobs/:id/concluido` (ou `/erro`).
4. `server_delivery` nunca chama o `api_gdoor` diretamente — quando um pedido vira `delivered` (`PedidosService.atualizarStatus`), só faz `INSERT` numa fila (`gdoor_jobs`), que o poller consome.

## Por que não é mais push

A primeira versão fazia `server_delivery` chamar `POST {API_GDOOR_URL}/pedidos` direto. Funciona em dev (tudo na mesma máquina), mas **quebra em produção**: `server_delivery` roda na nuvem (VPS/EasyPanel) e não alcança uma máquina de restaurante atrás de NAT/roteador doméstico sem port-forward. Polling (agente puxa) resolve isso sem exigir nenhuma configuração de rede do lado do restaurante — mesma razão de design do print-agent.

## Mecanismo GDOOR (engenharia reversa, não documentação oficial)

Pré-venda pro PDV NFC-e = linha em `VENDAS` com `MODELO='PV'`, `PROCESSADA=1`, `CANCELADA=0`, `IMPORTADO=0`. Itens em `ITEVENDAS` (FK `ID_VENDAS`). Cliente via `PDV_CLIENTE` (`ID_VENDA`, `CPFCNPJ`, `NOME`). Numeração: `NOTA = GEN_ID(GEN_VENDAS_ID,1)`. `SERIE`/`LOJA`/`CAIXA` fixos via `.env` (`VENDAS_SERIE`, `VENDAS_LOJA`, `VENDAS_CAIXA`). Produto precisa existir em `ESTOQUE.CODIGO` (cadastro fiscal feito pela tela do GDOOR, não por SQL). **Homologar com suporte GDOOR antes de produção real** — isso ainda não foi feito.

**Arquitetura local desta máquina de dev**: Firebird 32-bit — `fbclient.dll` confirmado 32-bit (header PE `0x14c`). Rodar com `py -3.13-32` (venv dedicado em `.venv/`), não a Python 64-bit padrão do PATH. `fbclient.dll` já registrado em `C:\Windows\SysWOW64`, resolvido automaticamente por processo 32-bit.

## Mapeamento produto → código GDOOR

Chave é `product_id` (id numérico do Supabase — `products` não tem SKU próprio). Cadastro via `POST /mapeamento` no próprio `api_gdoor` (sem UI de admin ainda — ver "Não feito" abaixo).

## Endpoints

**`server_delivery` (lado dono, painel — `RestaurantOwnerGuard`)**: `POST restaurante/gdoor/gerar-token`, `GET restaurante/gdoor/status`, `PATCH restaurante/gdoor/cnpj-esperado`.

**`server_delivery` (lado agente — `AgenteGdoorGuard`, header `x-gdoor-agente-token`)**: `GET agente-gdoor/me`, `POST agente-gdoor/cnpj`, `GET agente-gdoor/jobs/pendentes`, `POST agente-gdoor/jobs/:id/concluido`, `POST agente-gdoor/jobs/:id/erro`.

**`api_gdoor`**: `POST /mapeamento`, `GET /mapeamento`, `GET /saude`. `POST /pedidos` ainda existe mas é só pra teste manual via curl — não é mais o caminho principal (ver `app/main.py`).

## O que falta

- [ ] Homologação formal com suporte GDOOR (mecanismo é engenharia reversa).
- [ ] Tela de admin pra mapear produto↔código GDOOR (por enquanto via `POST /mapeamento` direto).
- [ ] Empacotar `api_gdoor` como executável instalável (PyInstaller, ex.) — hoje roda via `uvicorn` manual, sem instalador tipo o do print-agent.
- [ ] Revogação/expiração de token — hoje só sobrescreve ao regenerar, sem TTL (mesmo nível do print-agent hoje).
