# Integração api_gdoor ↔ server_delivery ↔ GDOOR SLIM

**Status atual: pareamento tipo "agente" (mesmo padrão do print-agent) implementado e testado de ponta a ponta contra o Firebird real do GDOOR SLIM local.** Este documento substitui a versão anterior (que descrevia um modelo de webhook "push" — abandonado, ver seção "Por que não é mais push" abaixo).

## Arquitetura

`api_gdoor` roda como **agente local**, na mesma máquina/rede do GDOOR SLIM — igual o `print-agent` (`DeliveryHubAgente.exe`) já faz pra impressão. Ele **puxa** (polling) os pedidos pendentes do `server_delivery`, nunca o contrário:

1. Dono gera um token de conexão em `/restaurante/config` (painel, botão "Gerar token de conexão", componente `GdoorAgentePanel`).
2. Token colado na GUI de pareamento (`parear_gui.py`/`parear.bat`, botão "Conectar") — grava em `local_config.json` (`%APPDATA%\DeliveryHubAgenteGdoor`), **não** em `.env` (ver seção "Configuração" abaixo — mesmo padrão do print-agent, pensado pra funcionar numa instalação empacotada sem nenhum arquivo pra editar na mão). **Isso só testa a conexão uma vez** (`GET /agente-gdoor/me`) e pode ser fechado em seguida — não inicia o poller, não fica processando nada (ver Gotcha abaixo).
3. `iniciar.bat` (`uvicorn app.main:app`) precisa ser executado **separadamente** e **ficar rodando continuamente** (janela aberta, ou instalado pra iniciar com o Windows) — é só nesse processo que `app/poller.py` de fato roda em background (thread, iniciado no `startup` do FastAPI), a cada `POLLER_INTERVALO_SEG` (padrão 5s):
   - `POST /agente-gdoor/cnpj` — reporta o CNPJ lido de `EMITENTE.CNPJ` no Firebird local (não existe campo "SERIAL" dedicado no GDOOR — CNPJ é o identificador usado).
   - `GET /agente-gdoor/jobs/pendentes` — só devolve trabalho se o CNPJ reportado bater com o `gdoor_cnpj_esperado` cadastrado no painel (`bloqueado: true` se não bater — trava de segurança extra além do token).
   - Pra cada job: grava a pré-venda no Firebird (`firebird_client.criar_pre_venda`) e reporta `POST /agente-gdoor/jobs/:id/concluido` (ou `/erro`).
4. `server_delivery` nunca chama o `api_gdoor` diretamente — quando uma venda é concluída (pedido de delivery vira `delivered`, ou comanda/balcão de salão é paga via `SalaoPdvService.pagar()`, ou o garçom fecha a comanda em `SalaoService.fecharComanda()`), só faz `INSERT` numa fila (`gdoor_jobs`), que o poller consome. `GdoorService.criarJob()` ignora se já existe job pendente/processado pro mesmo pedido (evita duplicar quando mais de um gatilho dispara pra mesma venda).
5. A cada ~12 ciclos (~1x/min com `POLLER_INTERVALO_SEG=5`), o poller também reporta o catálogo `ESTOQUE` do GDOOR local via `POST /agente-gdoor/estoque`, cacheado em `gdoor_estoque_cache` — alimenta o seletor de código no painel (o agente nunca decide mapeamento sozinho).

### Gotcha: pareamento "conectado" não significa que o agente está rodando (2026-08-30)

`parear_gui.py` e `iniciar.bat` são dois programas diferentes, fácil confundir: a GUI de pareamento só faz um teste pontual de conexão (`GET /agente-gdoor/me`) e atualiza `gdoor_agente_ultimo_ping` **uma vez**, ao clicar "Conectar" — não inicia nenhum loop. Se `iniciar.bat` nunca foi executado (ou a janela foi fechada), o painel pode mostrar "Online" por até 60s depois desse único clique (janela de `statusAgente()`), dando falsa sensação de que está tudo funcionando — mas nenhum job em `gdoor_jobs` é processado, ficam presos em `pendente` pra sempre, sem erro nenhum (o próprio `_reportar_cnpj`/ping nunca mais roda de novo, então o "Online" também cai sozinho depois de 60s, mas é fácil não notar isso na hora).

**Como apply:** se um job fica `pendente` indefinidamente mesmo com CNPJ conferindo e token válido (confirmar com `GET /agente-gdoor/jobs/pendentes` direto, deve retornar os jobs com `bloqueado: false`), suspeitar primeiro de que `iniciar.bat` não está rodando de fato — pedir pro dono confirmar que existe uma janela preta aberta com `uvicorn` e linhas de log tipo `job X importado como venda_id=Y`, não só a telinha de pareamento. Painel (`GdoorAgentePanel`) já foi ajustado pra deixar essa distinção explícita no passo a passo.

## Configuração — sem `.env` em produção

`api_gdoor` não depende de `.env` pra rodar numa instalação real, pelo mesmo motivo do `print-agent`: quando distribuído pra máquina de um restaurante, não tem como colocar um arquivo na pasta de instalação de cada cliente (nem editar um `server_delivery/.env` — esse é o `.env` do **backend na nuvem**, compartilhado por todos os restaurantes; não tem como guardar lá o token/CNPJ de uma instalação específica, e a nuvem não alcança a máquina do restaurante pra "empurrar" config de volta, mesmo motivo do polling).

O padrão é o mesmo do `print-agent/config.py`:
- **URL do backend**: fixa no código (`app/local_config.py:DEFAULT_BACKEND_URL`, aponta pra produção). Só muda via `.env`/`local_config.json` em caso raro.
- **Token de pareamento** e demais dados que variam por instalação (conexão Firebird, se o GDOOR não estiver no caminho padrão): ficam em `local_config.json` (`%APPDATA%\DeliveryHubAgenteGdoor`), criado/editado pela GUI de pareamento (`parear_gui.py` → `local_config.definir_token()`) — nunca precisa editar arquivo na mão. Tem defaults pro caminho/porta/usuário padrão do GDOOR SLIM, então a maioria das instalações funciona sem editar nada.
- **`.env`** (`app/config.py`) continua existindo só como camada de conveniência pra desenvolvimento nesta máquina — se existir, tem prioridade sobre `local_config.json`. Uma instalação empacotada (sem esse arquivo) roda só com `local_config.json` + defaults.

## Por que não é mais push

A primeira versão fazia `server_delivery` chamar `POST {API_GDOOR_URL}/pedidos` direto. Funciona em dev (tudo na mesma máquina), mas **quebra em produção**: `server_delivery` roda na nuvem (VPS/EasyPanel) e não alcança uma máquina de restaurante atrás de NAT/roteador doméstico sem port-forward. Polling (agente puxa) resolve isso sem exigir nenhuma configuração de rede do lado do restaurante — mesma razão de design do print-agent.

## Mecanismo GDOOR (engenharia reversa, não documentação oficial)

Pré-venda pro PDV NFC-e = linha em `VENDAS` com `MODELO='PV'`, `NFE_STATUS='Venda Pendente'` (texto literal — é isso que a tela exibe na coluna Status; `PROCESSADA=0` sozinho não é suficiente), `CANCELADA=0`, `IMPORTADO=0`, além de `SAIDA='X'`, `NATUREZA='Venda a Vista'`, `CFOP='5.102'`, `DATA_SAIDA`/`HORA_SAIDA` preenchidos. **`PROCESSADA=0` é proposital** — a pré-venda nasce pendente e exige confirmação manual de alguém no caixa (`PROCESSADA=1` só acontece quando um humano clica "Concluir" na tela do GDOOR). Itens em `ITEVENDAS` (FK `ID_VENDAS`), com campos fiscais do item também preenchidos (`COD_CFOP`, `CFOP`, `ST` = `ESTOQUE.OST + ESTOQUE.ST` concatenados, `VALOR_TOT_PRO`, `DATA_SAIDA`/`HORA_SAIDA`, tributos aproximados — ver abaixo). Cliente via `VENDAS.CLIENTE` — código do cliente cadastrado em `CLIENTE` (`'000000'` = "Consumidor" genérico se o pedido não tiver cliente sincronizado com CPF/CNPJ; se tiver, usa o código mapeado via `gdoor_cliente_mapeamento`, resolvido em `GdoorService.criarJob`). **`PDV_CLIENTE` não é usado por esse fluxo** (conferido contra referências reais: nunca tem linha lá). Numeração: `NOTA = GEN_ID(GEN_VENDAS_ID,1)`, formatado com zero à esquerda pra **9 dígitos** (`.zfill(9)`) — confirmado contra pré-vendas reais criadas na tela do GDOOR (ex.: `000000015`).

**Produto precisa ter `ESTOQUE.COD_NCM` (NCM) e `ESTOQUE.ST` (CST/CSOSN, sempre junto do `OST` = origem) preenchidos** — sem isso a pré-venda até grava no banco, mas trava na hora de confirmar/emitir no GDOOR. `firebird_client.produtos_sem_fiscal_completo()` confere os dois antes de gravar qualquer coisa; se faltar em algum item, `criar_pre_venda` levanta `ValueError` e o job vai pra `erro` com a lista de códigos incompletos — nunca cria uma pré-venda fiscalmente incompleta. NCM/CST são cadastrados manualmente na tela do GDOOR (exigem julgamento fiscal, não dá pra inferir a partir do nome do produto) — isso é sempre um passo manual do dono depois de criar/mapear o produto.

**Tabelas de ligação, além de `VENDAS`/`ITEVENDAS`** (todas gravadas por `criar_pre_venda`, descobertas comparando pré-vendas 100% criadas pela própria tela do GDOOR, campo a campo e tabela a tabela — não tem nenhuma documentação oficial disso):
- `VENDAS_NUMERO_DOC` (`NOTA, SERIE, MODELO, ID_VENDAS`) — sem isso a tela nem acha o registro pra abrir ("Alterar" não fazia nada).
- `PREVENDA_MOV` (`ID, MOV_ESTOQUE, MOV_FINANCEIRO, ID_PREVENDA`) — existe desde a criação (`ID_PREVENDA` = `VENDAS.ID`, apesar do nome, **não** referencia a tabela legada `PREVENDA`), gravada com as duas flags zeradas; o próprio GDOOR vira as duas pra `1` ao concluir. **`MOV_OPERADORES` nunca deve ser inserido na criação** — essa tabela só existe em vendas JÁ CONCLUÍDAS (é o próprio GDOOR que cria ao clicar "Concluir"); inserir cedo demais faz a tela "tentar processar e voltar" sem terminar, sem erro nenhum.
- **`PDV_ARQBIN` (`ID_VENDA, OBJETO`) — a peça decisiva.** Um dump em texto puro (`Objeto.Campo=valor`, `\r\n`, ~190 linhas) do objeto de venda inteiro (cabeçalho + todos os itens + pagamento default "Dinheiro" + tributos com casas cheias, não truncados) que a tela usa pra **recarregar a pré-venda inteira** ao abrir "Alterar"/"Concluir"/"Processar" — não lê as tabelas SQL de novo pra isso. Sem essa linha, a tela não dá erro nenhum: só volta pra lista sem processar. Gerado por `firebird_client._gerar_blob_pdv_arqbin()`, formato/ordem/nomes de campo confirmados byte a byte contra referências reais (venda_id=27, 30).
- Tributo aproximado (Lei 12.741/2012, `ITEVENDAS.VALOR_TOT_TRI`/`TRIB_FEDERAL`/`TRIB_ESTADUAL`/`TRIB_MUNICIPAL`) calculado a partir da tabela IBPT interna do GDOOR (`NCM_TAB`, ligada por `ESTOQUE.ID_NCM`), truncado em 2 casas na coluna SQL (não arredondado — ex.: `15.90 * 13.45% = 2.13855` grava `2.13`) mas com casas cheias dentro do blob `PDV_ARQBIN`.

**Homologar com suporte GDOOR antes de produção real** — isso ainda não foi feito.

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
