import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Conexao Firebird (mesmo banco que o GDOOR SLIM usa)
FB_HOST = os.getenv("FB_HOST", "127.0.0.1")
FB_PORT = int(os.getenv("FB_PORT", "3050"))
FB_DATABASE = os.getenv("FB_DATABASE", r"C:\GDOOR Sistemas\GDOOR SLIM\DATAGES.FDB")
FB_USER = os.getenv("FB_USER", "SYSDBA")
FB_PASSWORD = os.getenv("FB_PASSWORD", "")

# Caminho da fbclient.dll (biblioteca cliente do Firebird). Se o Firebird
# estiver registrado no PATH do Windows, pode deixar em branco. Senao,
# aponte para a fbclient.dll da instalacao do GDOOR/Firebird.
FB_CLIENT_LIBRARY = os.getenv("FB_CLIENT_LIBRARY", "")

# Dados fixos do documento "PV" (pre-venda) dentro de VENDAS
VENDAS_MODELO = "PV"
VENDAS_SERIE = os.getenv("VENDAS_SERIE", "001")
VENDAS_LOJA = os.getenv("VENDAS_LOJA", "0001")
VENDAS_CAIXA = os.getenv("VENDAS_CAIXA", "0001")
VENDAS_OPERADOR = os.getenv("VENDAS_OPERADOR", "DELIVERY")

# Armazenamento local (mapeamento de produtos + deduplicacao de pedidos)
SQLITE_PATH = os.getenv("SQLITE_PATH", str(BASE_DIR / "data" / "sync.db"))

# Autenticacao simples do endpoint de webhook manual /pedidos (so pra teste via
# curl — o fluxo principal e o poller abaixo, que usa GDOOR_AGENTE_TOKEN)
WEBHOOK_TOKEN = os.getenv("WEBHOOK_TOKEN", "")

# Poller — busca pedidos pendentes no server_delivery (nuvem) e grava no GDOOR
# local. E o agente que puxa, nunca o servidor empurra (mesmo padrao do
# print-agent) — funciona atras de qualquer NAT/roteador sem configuracao de rede.
SERVER_DELIVERY_URL = os.getenv("SERVER_DELIVERY_URL", "http://localhost:3002")
# Token de pareamento gerado em /restaurante/config no painel e colado aqui.
GDOOR_AGENTE_TOKEN = os.getenv("GDOOR_AGENTE_TOKEN", "")
POLLER_INTERVALO_SEG = float(os.getenv("POLLER_INTERVALO_SEG", "5"))
