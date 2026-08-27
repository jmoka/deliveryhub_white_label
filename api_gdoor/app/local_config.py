"""Configuração local do agente — mesmo padrão do print-agent (config.py de lá):
sem depender de um arquivo .env em produção, porque não tem como colocar um
arquivo na máquina de cada restaurante na hora da instalação. A URL do backend
vem fixa no código (produção); tudo que varia por instalação (token de
pareamento, dados do Firebird local se o GDOOR não estiver no caminho padrão)
fica num JSON em %APPDATA%, criado/editado pela GUI de pareamento — nunca
precisa editar arquivo na mão."""
import json
import os
from pathlib import Path

DEFAULT_BACKEND_URL = "https://app-desenvolvimento-server-delivery.ubjifz.easypanel.host"

_PADRAO = {
    "backend_url": DEFAULT_BACKEND_URL,
    "token": None,
    "fb_host": "127.0.0.1",
    "fb_port": 3050,
    "fb_database": r"C:\GDOOR Sistemas\GDOOR SLIM\DATAGES.FDB",
    "fb_user": "SYSDBA",
    "fb_password": "masterkey",
    "fb_client_library": "",
    "vendas_serie": "001",
    "vendas_loja": "0001",
    "vendas_caixa": "0001",
    "vendas_operador": "DELIVERY",
}


def _config_dir() -> Path:
    base = os.environ.get("APPDATA") or str(Path.home())
    path = Path(base) / "DeliveryHubAgenteGdoor"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _config_path() -> Path:
    return _config_dir() / "config.json"


def carregar() -> dict:
    dados = dict(_PADRAO)
    path = _config_path()
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            dados.update(json.load(f))
    return dados


def salvar(config: dict) -> None:
    with open(_config_path(), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def definir_token(token: str, backend_url: str | None = None) -> dict:
    config = carregar()
    config["token"] = token.strip()
    if backend_url:
        config["backend_url"] = backend_url.strip()
    salvar(config)
    return config
