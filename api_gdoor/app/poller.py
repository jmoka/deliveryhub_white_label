import logging
import threading
import time

import requests

from . import config, firebird_client

logger = logging.getLogger("gdoor_delivery_sync.poller")

# Catálogo do ESTOQUE só muda quando alguém mexe no GDOOR — não precisa reportar
# a cada ciclo de 5s. A cada N ciclos é o suficiente pro painel ficar atualizado.
_CICLOS_POR_REPORT_ESTOQUE = 12


def _headers() -> dict:
    return {"x-gdoor-agente-token": config.GDOOR_AGENTE_TOKEN}


def _reportar_cnpj() -> None:
    cnpj = firebird_client.ler_cnpj_emitente()
    if not cnpj:
        return
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/cnpj",
            json={"cnpj": cnpj},
            headers=_headers(),
            timeout=10,
        )
    except Exception:
        logger.warning("falha ao reportar CNPJ pro server_delivery", exc_info=True)


def _reportar_estoque() -> None:
    try:
        itens = firebird_client.listar_produtos_estoque()
    except Exception:
        logger.warning("falha ao ler ESTOQUE do GDOOR local", exc_info=True)
        return
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/estoque",
            json={"itens": itens},
            headers=_headers(),
            timeout=15,
        )
    except Exception:
        logger.warning("falha ao reportar estoque pro server_delivery", exc_info=True)


def _reportar_clientes() -> None:
    try:
        itens = firebird_client.listar_clientes()
    except Exception:
        logger.warning("falha ao ler CLIENTE do GDOOR local", exc_info=True)
        return
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/clientes",
            json={"itens": itens},
            headers=_headers(),
            timeout=15,
        )
    except Exception:
        logger.warning("falha ao reportar clientes pro server_delivery", exc_info=True)


def _marcar_concluido(job_id: int, venda_id_gdoor: str) -> None:
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/jobs/{job_id}/concluido",
            json={"venda_id_gdoor": venda_id_gdoor},
            headers=_headers(),
            timeout=10,
        )
    except Exception:
        logger.warning("falha ao reportar job %s concluido", job_id, exc_info=True)


def _marcar_erro(job_id: int, mensagem: str) -> None:
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/jobs/{job_id}/erro",
            json={"mensagem": mensagem},
            headers=_headers(),
            timeout=10,
        )
    except Exception:
        logger.warning("falha ao reportar erro do job %s", job_id, exc_info=True)


def _processar_job(job: dict) -> None:
    job_id = job["id"]
    payload = job.get("payload") or {}
    cliente = payload.get("cliente") or {}
    itens = payload.get("itens") or []

    # codigo_gdoor já vem resolvido no payload — o server_delivery mapeia
    # product_id -> codigo_gdoor com o cadastro feito pelo dono no painel, antes
    # de enfileirar o job (gdoor.service.ts, criarJob). O agente só executa.
    nao_mapeados = [i["product_id"] for i in itens if not i.get("codigo_gdoor")]
    if nao_mapeados:
        logger.warning("job %s tem produto(s) sem mapeamento: %s", job_id, nao_mapeados)
        _marcar_erro(
            job_id,
            f"produto(s) sem mapeamento para o codigo do GDOOR: {nao_mapeados}. "
            "Mapeie em Configuracoes > Integracao GDOOR no painel.",
        )
        return

    itens_para_gravar = [
        firebird_client.ItemParaGravar(
            codigo_gdoor=i["codigo_gdoor"],
            descricao=i.get("product_name") or "",
            quantidade=i["quantity"],
            valor_unitario=i["unit_price"],
        )
        for i in itens
    ]

    try:
        venda_id = firebird_client.criar_pre_venda(
            cliente_nome=cliente.get("name") or "Cliente",
            cliente_cpf_cnpj=cliente.get("cpf_cnpj") or "",
            itens=itens_para_gravar,
        )
    except Exception as e:
        logger.exception("falha ao gravar job %s no GDOOR", job_id)
        _marcar_erro(job_id, str(e))
        return

    logger.info("job %s importado como venda_id=%s", job_id, venda_id)
    _marcar_concluido(job_id, str(venda_id))


def _marcar_produto_criado(job_id: int, codigo_gdoor: str) -> None:
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/criar-produto/{job_id}/concluido",
            json={"codigo_gdoor": codigo_gdoor},
            headers=_headers(),
            timeout=10,
        )
    except Exception:
        logger.warning("falha ao reportar produto criado (job %s)", job_id, exc_info=True)


def _marcar_produto_erro(job_id: int, mensagem: str) -> None:
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/criar-produto/{job_id}/erro",
            json={"mensagem": mensagem},
            headers=_headers(),
            timeout=10,
        )
    except Exception:
        logger.warning("falha ao reportar erro de criacao de produto (job %s)", job_id, exc_info=True)


def _processar_criacao_produto(job: dict) -> None:
    job_id = job["id"]
    payload = job.get("payload") or {}
    try:
        codigo = firebird_client.criar_produto_estoque(
            descricao=payload.get("descricao") or "",
            preco_venda=payload.get("preco_venda") or 0,
            qtd=payload.get("qtd") or 0,
            unidade=payload.get("unidade") or "UN",
        )
    except Exception as e:
        logger.exception("falha ao criar produto no GDOOR (job %s)", job_id)
        _marcar_produto_erro(job_id, str(e))
        return

    logger.info("job %s criou produto no GDOOR com codigo=%s", job_id, codigo)
    _marcar_produto_criado(job_id, codigo)


def _marcar_cliente_criado(job_id: int, codigo_gdoor: str) -> None:
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/criar-cliente/{job_id}/concluido",
            json={"codigo_gdoor": codigo_gdoor},
            headers=_headers(),
            timeout=10,
        )
    except Exception:
        logger.warning("falha ao reportar cliente criado (job %s)", job_id, exc_info=True)


def _marcar_cliente_erro(job_id: int, mensagem: str) -> None:
    try:
        requests.post(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/criar-cliente/{job_id}/erro",
            json={"mensagem": mensagem},
            headers=_headers(),
            timeout=10,
        )
    except Exception:
        logger.warning("falha ao reportar erro de criacao de cliente (job %s)", job_id, exc_info=True)


def _processar_criacao_cliente(job: dict) -> None:
    job_id = job["id"]
    payload = job.get("payload") or {}
    try:
        codigo = firebird_client.criar_cliente(
            nome=payload.get("nome") or "Cliente",
            cnpj_cnpf=payload.get("cnpj_cnpf"),
            telefone=payload.get("telefone"),
            email=payload.get("email"),
            endereco=payload.get("endereco"),
            numero=payload.get("numero"),
            complemento=payload.get("complemento"),
            bairro=payload.get("bairro"),
            cidade=payload.get("cidade"),
            uf=payload.get("uf"),
            cep=payload.get("cep"),
        )
    except Exception as e:
        logger.exception("falha ao criar cliente no GDOOR (job %s)", job_id)
        _marcar_cliente_erro(job_id, str(e))
        return

    logger.info("job %s criou cliente no GDOOR com codigo=%s", job_id, codigo)
    _marcar_cliente_criado(job_id, codigo)


def _ciclo() -> None:
    _reportar_cnpj()

    try:
        res = requests.get(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/jobs/pendentes",
            headers=_headers(),
            timeout=10,
        )
        res.raise_for_status()
    except Exception:
        logger.warning("falha ao buscar jobs pendentes", exc_info=True)
        return

    dados = res.json()
    if dados.get("bloqueado"):
        logger.warning("CNPJ local nao confere com o cadastrado no painel — jobs bloqueados ate corrigir")
        return

    for job in dados.get("jobs", []):
        _processar_job(job)

    try:
        res_produtos = requests.get(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/criar-produto/pendentes",
            headers=_headers(),
            timeout=10,
        )
        res_produtos.raise_for_status()
        dados_produtos = res_produtos.json()
        if not dados_produtos.get("bloqueado"):
            for job in dados_produtos.get("jobs", []):
                _processar_criacao_produto(job)
    except Exception:
        logger.warning("falha ao buscar produtos pendentes de criacao", exc_info=True)

    try:
        res_clientes = requests.get(
            f"{config.SERVER_DELIVERY_URL}/agente-gdoor/criar-cliente/pendentes",
            headers=_headers(),
            timeout=10,
        )
        res_clientes.raise_for_status()
        dados_clientes = res_clientes.json()
        if not dados_clientes.get("bloqueado"):
            for job in dados_clientes.get("jobs", []):
                _processar_criacao_cliente(job)
    except Exception:
        logger.warning("falha ao buscar clientes pendentes de criacao", exc_info=True)


def _loop() -> None:
    ciclo_num = 0
    while True:
        try:
            _ciclo()
            if ciclo_num % _CICLOS_POR_REPORT_ESTOQUE == 0:
                _reportar_estoque()
                _reportar_clientes()
        except Exception:
            logger.exception("erro inesperado no ciclo do poller")
        ciclo_num += 1
        time.sleep(config.POLLER_INTERVALO_SEG)


def iniciar() -> None:
    if not config.GDOOR_AGENTE_TOKEN:
        logger.warning(
            "GDOOR_AGENTE_TOKEN nao configurado — poller desligado. "
            "Gere um token de conexao em /restaurante/config no painel e cole no .env."
        )
        return

    thread = threading.Thread(target=_loop, daemon=True)
    thread.start()
    logger.info(
        "poller iniciado — consultando %s a cada %ss",
        config.SERVER_DELIVERY_URL,
        config.POLLER_INTERVALO_SEG,
    )
