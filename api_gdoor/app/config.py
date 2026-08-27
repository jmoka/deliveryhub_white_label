import os
from pathlib import Path

from dotenv import load_dotenv

from . import local_config

BASE_DIR = Path(__file__).resolve().parent.parent

# .env é só conveniência pra dev nesta máquina — instalação real (empacotada
# como .exe e distribuída pro restaurante) não tem esse arquivo, roda só com os
# valores de local_config.py (JSON em %APPDATA%, escrito pela GUI de pareamento
# + defaults do GDOOR padrão). Se existir, .env tem prioridade sobre o JSON.
load_dotenv(BASE_DIR / ".env")

_cfg = local_config.carregar()


def _get(env_key: str, cfg_key: str, default):
    valor = os.getenv(env_key)
    if valor:
        return valor
    valor = _cfg.get(cfg_key)
    return valor if valor not in (None, "") else default


# Conexao Firebird (mesmo banco que o GDOOR SLIM usa)
FB_HOST = _get("FB_HOST", "fb_host", "127.0.0.1")
FB_PORT = int(_get("FB_PORT", "fb_port", 3050))
FB_DATABASE = _get("FB_DATABASE", "fb_database", r"C:\GDOOR Sistemas\GDOOR SLIM\DATAGES.FDB")
FB_USER = _get("FB_USER", "fb_user", "SYSDBA")
FB_PASSWORD = _get("FB_PASSWORD", "fb_password", "masterkey")

# Caminho da fbclient.dll (biblioteca cliente do Firebird). Se o Firebird
# estiver registrado no PATH do Windows, pode deixar em branco. Senao,
# aponte para a fbclient.dll da instalacao do GDOOR/Firebird.
FB_CLIENT_LIBRARY = _get("FB_CLIENT_LIBRARY", "fb_client_library", "")

# Dados fixos do documento "PV" (pre-venda) dentro de VENDAS
VENDAS_MODELO = "PV"
VENDAS_SERIE = _get("VENDAS_SERIE", "vendas_serie", "001")
VENDAS_LOJA = _get("VENDAS_LOJA", "vendas_loja", "0001")
VENDAS_CAIXA = _get("VENDAS_CAIXA", "vendas_caixa", "0001")
VENDAS_OPERADOR = _get("VENDAS_OPERADOR", "vendas_operador", "DELIVERY")

# Armazenamento local (deduplicacao do webhook manual /pedidos — legado, so teste)
SQLITE_PATH = os.getenv("SQLITE_PATH", str(BASE_DIR / "data" / "sync.db"))

# Autenticacao simples do endpoint de webhook manual /pedidos (so pra teste via
# curl — o fluxo principal e o poller abaixo, que usa GDOOR_AGENTE_TOKEN)
WEBHOOK_TOKEN = os.getenv("WEBHOOK_TOKEN", "")

# Poller — busca pedidos pendentes no server_delivery (nuvem) e grava no GDOOR
# local. E o agente que puxa, nunca o servidor empurra (mesmo padrao do
# print-agent) — funciona atras de qualquer NAT/roteador sem configuracao de rede.
# URL de producao fixa em local_config.DEFAULT_BACKEND_URL — so muda via .env
# nesta maquina de dev, ou editando backend_url no config.json (caso raro).
SERVER_DELIVERY_URL = _get("SERVER_DELIVERY_URL", "backend_url", local_config.DEFAULT_BACKEND_URL)
# Token de pareamento — gerado em /restaurante/config no painel, colado na GUI
# de pareamento (parear_gui.py), que grava em local_config.json via definir_token().
GDOOR_AGENTE_TOKEN = _get("GDOOR_AGENTE_TOKEN", "token", "")
POLLER_INTERVALO_SEG = float(os.getenv("POLLER_INTERVALO_SEG", "5"))
