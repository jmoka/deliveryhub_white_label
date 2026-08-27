import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Optional

from . import config


def _connect() -> sqlite3.Connection:
    Path(config.SQLITE_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def _cursor() -> Iterator[sqlite3.Cursor]:
    conn = _connect()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with _cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS produto_mapa (
                product_id INTEGER PRIMARY KEY,
                codigo_gdoor TEXT NOT NULL,
                descricao TEXT,
                atualizado_em TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS pedidos_importados (
                pedido_id TEXT PRIMARY KEY,
                venda_id INTEGER NOT NULL,
                importado_em TEXT NOT NULL
            )
            """
        )


def get_codigo_gdoor(product_id: int) -> Optional[str]:
    with _cursor() as cur:
        cur.execute("SELECT codigo_gdoor FROM produto_mapa WHERE product_id = ?", (product_id,))
        row = cur.fetchone()
        return row["codigo_gdoor"] if row else None


def upsert_mapeamento(product_id: int, codigo_gdoor: str, descricao: str = "") -> None:
    with _cursor() as cur:
        cur.execute(
            """
            INSERT INTO produto_mapa (product_id, codigo_gdoor, descricao, atualizado_em)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(product_id) DO UPDATE SET
                codigo_gdoor = excluded.codigo_gdoor,
                descricao = excluded.descricao,
                atualizado_em = excluded.atualizado_em
            """,
            (product_id, codigo_gdoor, descricao, datetime.now(timezone.utc).isoformat()),
        )


def listar_mapeamentos() -> list[sqlite3.Row]:
    with _cursor() as cur:
        cur.execute("SELECT product_id, codigo_gdoor, descricao FROM produto_mapa ORDER BY product_id")
        return cur.fetchall()


def venda_id_do_pedido(pedido_id: str) -> Optional[int]:
    with _cursor() as cur:
        cur.execute(
            "SELECT venda_id FROM pedidos_importados WHERE pedido_id = ?", (pedido_id,)
        )
        row = cur.fetchone()
        return row["venda_id"] if row else None


def registrar_importacao(pedido_id: str, venda_id: int) -> None:
    with _cursor() as cur:
        cur.execute(
            """
            INSERT INTO pedidos_importados (pedido_id, venda_id, importado_em)
            VALUES (?, ?, ?)
            """,
            (pedido_id, venda_id, datetime.now(timezone.utc).isoformat()),
        )
