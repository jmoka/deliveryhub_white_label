import logging

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from . import config, firebird_client, mapping, poller
from .models import PedidoWebhook

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gdoor_delivery_sync")

app = FastAPI(title="GDOOR Delivery Sync")


@app.on_event("startup")
def _startup() -> None:
    mapping.init_db()
    poller.iniciar()


def _checar_token(x_webhook_token: str | None) -> None:
    if config.WEBHOOK_TOKEN and x_webhook_token != config.WEBHOOK_TOKEN:
        raise HTTPException(status_code=401, detail="token invalido")


# Webhook manual — só pra teste via curl/Postman. O fluxo principal em produção
# é o poller (app/poller.py), que puxa os pedidos pendentes do server_delivery
# em vez de esperar ele empurrar (server_delivery roda na nuvem, não alcança
# essa máquina atrás de NAT).
@app.post("/pedidos", status_code=201)
def receber_pedido(
    pedido: PedidoWebhook, x_webhook_token: str | None = Header(default=None)
):
    _checar_token(x_webhook_token)

    venda_id_existente = mapping.venda_id_do_pedido(pedido.pedido_id)
    if venda_id_existente is not None:
        logger.info("pedido %s ja importado (venda_id=%s)", pedido.pedido_id, venda_id_existente)
        return {"status": "ja_importado", "venda_id": venda_id_existente}

    nao_mapeados = [
        item.product_id for item in pedido.itens if mapping.get_codigo_gdoor(item.product_id) is None
    ]
    if nao_mapeados:
        raise HTTPException(
            status_code=422,
            detail={
                "erro": "produto(s) sem mapeamento para o codigo do GDOOR",
                "product_ids": nao_mapeados,
            },
        )

    itens_para_gravar = [
        firebird_client.ItemParaGravar(
            codigo_gdoor=mapping.get_codigo_gdoor(item.product_id),
            descricao=item.descricao,
            quantidade=item.quantidade,
            valor_unitario=item.valor_unitario,
            unidade=item.unidade,
        )
        for item in pedido.itens
    ]

    try:
        venda_id = firebird_client.criar_pre_venda(
            cliente_nome=pedido.cliente.nome,
            cliente_cpf_cnpj=pedido.cliente.cpf_cnpj or "",
            itens=itens_para_gravar,
        )
    except Exception:
        logger.exception("falha ao gravar pedido %s no GDOOR", pedido.pedido_id)
        raise HTTPException(status_code=502, detail="falha ao gravar no GDOOR")

    mapping.registrar_importacao(pedido.pedido_id, venda_id)
    logger.info("pedido %s importado como venda_id=%s", pedido.pedido_id, venda_id)
    return {"status": "importado", "venda_id": venda_id}


class MapeamentoIn(BaseModel):
    product_id: int
    codigo_gdoor: str
    descricao: str = ""


@app.post("/mapeamento", status_code=201)
def cadastrar_mapeamento(
    body: MapeamentoIn, x_webhook_token: str | None = Header(default=None)
):
    _checar_token(x_webhook_token)
    if not firebird_client.produto_existe(body.codigo_gdoor):
        raise HTTPException(
            status_code=422,
            detail=f"codigo {body.codigo_gdoor} nao existe em ESTOQUE no GDOOR",
        )
    mapping.upsert_mapeamento(body.product_id, body.codigo_gdoor, body.descricao)
    return {"status": "ok"}


@app.get("/mapeamento")
def listar_mapeamento(x_webhook_token: str | None = Header(default=None)):
    _checar_token(x_webhook_token)
    return [dict(row) for row in mapping.listar_mapeamentos()]


@app.get("/saude")
def saude():
    return {"status": "ok"}
