"""Configuração local do agente — token de pareamento e URL do backend."""
import json
import os
from pathlib import Path

DEFAULT_BACKEND_URL = "https://app-desenvolvimento-server-delivery.ubjifz.easypanel.host"


def _config_dir() -> Path:
    base = os.environ.get("APPDATA") or str(Path.home())
    path = Path(base) / "DeliveryHubAgent"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _config_path() -> Path:
    return _config_dir() / "config.json"


def carregar() -> dict:
    path = _config_path()
    if not path.exists():
        return {"backend_url": DEFAULT_BACKEND_URL, "token": None}
    with open(path, "r", encoding="utf-8") as f:
        dados = json.load(f)
    dados.setdefault("backend_url", DEFAULT_BACKEND_URL)
    dados.setdefault("token", None)
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
