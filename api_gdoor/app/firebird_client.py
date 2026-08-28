from dataclasses import dataclass
from datetime import date

import firebird.driver as fb

from . import config

if config.FB_CLIENT_LIBRARY:
    fb.driver_config.fb_client_library.value = config.FB_CLIENT_LIBRARY


@dataclass
class ItemParaGravar:
    codigo_gdoor: str
    descricao: str
    quantidade: float
    valor_unitario: float
    unidade: str = "UN"

    @property
    def valor_total(self) -> float:
        return round(self.quantidade * self.valor_unitario, 2)


def _conectar():
    dsn = f"{config.FB_HOST}/{config.FB_PORT}:{config.FB_DATABASE}"
    # Banco do GDOOR é charset NONE (sem conversão no servidor) — sem isso o
    # driver assume um default implícito que depende do locale da máquina.
    # WIN1252 confirmado contra dados reais já gravados pelo GDOOR (EMITENTE).
    return fb.connect(dsn, user=config.FB_USER, password=config.FB_PASSWORD, charset="WIN1252")


def criar_pre_venda(
    cliente_nome: str, cliente_cpf_cnpj: str, itens: list[ItemParaGravar]
) -> int:
    """Grava um pedido fechado do delivery como pre-venda (VENDAS.MODELO='PV')
    para aparecer na importacao F3 do PDV NFC-e do GDOOR SLIM.
    Levanta fb.DatabaseError em caso de falha (ex.: produto sem FK valida)."""

    hoje = date.today()
    valor_total_nota = round(sum(i.valor_total for i in itens), 2)

    con = _conectar()
    try:
        cur = con.cursor()

        cur.execute("SELECT GEN_ID(GEN_VENDAS_ID, 1) FROM RDB$DATABASE")
        venda_id = cur.fetchone()[0]
        nota = str(venda_id)

        cur.execute(
            """
            INSERT INTO VENDAS (
                ID, NOTA, MODELO, SERIE, DATA_EMISSAO, LOJA, CAIXA,
                DENEGADA, SUBTRAIR_DESONERADO, PROCESSADA, CANCELADA, IMPORTADO,
                CLIENTE, VALOR_TOT_NOTA, VENDEDOR, OPERADOR
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                0, 0, 1, 0, 0,
                NULL, ?, ?, ?
            )
            """,
            (
                venda_id,
                nota,
                config.VENDAS_MODELO,
                config.VENDAS_SERIE,
                hoje,
                config.VENDAS_LOJA,
                config.VENDAS_CAIXA,
                valor_total_nota,
                config.VENDAS_OPERADOR,
                config.VENDAS_OPERADOR,
            ),
        )

        for numero_item, item in enumerate(itens, start=1):
            cur.execute("SELECT GEN_ID(GEN_ITEVENDAS_ID, 1) FROM RDB$DATABASE")
            item_id = cur.fetchone()[0]
            cur.execute(
                """
                INSERT INTO ITEVENDAS (
                    ID, ID_VENDAS, NOTA, MODELO, SERIE, DATA_EMISSAO, LOJA, CAIXA, ITEM,
                    CODIGO, DESCRICAO, UND, QTD, VALOR_UNITA, VALOR_LISTA,
                    TOTAL_DESCONTO, VALOR_TOTAL, CANCELADA
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    0, ?, 0
                )
                """,
                (
                    item_id,
                    venda_id,
                    nota,
                    config.VENDAS_MODELO,
                    config.VENDAS_SERIE,
                    hoje,
                    config.VENDAS_LOJA,
                    config.VENDAS_CAIXA,
                    numero_item,
                    item.codigo_gdoor,
                    item.descricao,
                    item.unidade,
                    item.quantidade,
                    item.valor_unitario,
                    item.valor_unitario,
                    item.valor_total,
                ),
            )

        cur.execute(
            "INSERT INTO PDV_CLIENTE (ID_VENDA, CPFCNPJ, NOME) VALUES (?, ?, ?)",
            (venda_id, cliente_cpf_cnpj, cliente_nome),
        )

        con.commit()
        return venda_id
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def listar_produtos_estoque(limite: int = 3000) -> list[dict]:
    """Catálogo de produtos do GDOOR (tabela ESTOQUE) — alimenta o modal de
    mapeamento no painel (seletor de código + comparação de divergência de
    nome/preço/qtd), o agente nunca decide sozinho qual código usar."""
    con = _conectar()
    try:
        cur = con.cursor()
        cur.execute(
            f"SELECT FIRST {limite} CODIGO, DESCRICAO, PRECO_VENDA, QTD, UND FROM ESTOQUE ORDER BY DESCRICAO"
        )
        itens = []
        for codigo, descricao, preco_venda, qtd, und in cur.fetchall():
            if not codigo:
                continue
            itens.append({
                "codigo": codigo.strip(),
                "descricao": (descricao or "").strip(),
                "preco_venda": float(preco_venda) if preco_venda is not None else None,
                "qtd": float(qtd) if qtd is not None else None,
                "unidade": (und or "").strip() or None,
            })
        return itens
    finally:
        con.close()


def proximo_codigo_estoque() -> str:
    """ESTOQUE.CODIGO não tem gerador (é digitado manualmente hoje, ex. '000001').
    Calcula o próximo sequencial numérico com o mesmo padding dos códigos já
    existentes. Seguro porque o poller processa um job de cada vez, nunca em
    paralelo — sem risco de duas criações pegarem o mesmo código."""
    con = _conectar()
    try:
        cur = con.cursor()
        cur.execute("SELECT CODIGO FROM ESTOQUE")
        numericos = []
        largura = 6
        for (codigo,) in cur.fetchall():
            if not codigo:
                continue
            codigo = codigo.strip()
            if codigo.isdigit():
                numericos.append(int(codigo))
                largura = max(largura, len(codigo))
        proximo = (max(numericos) + 1) if numericos else 1
        return str(proximo).zfill(largura)
    finally:
        con.close()


def criar_produto_estoque(
    descricao: str, preco_venda: float, qtd: float, unidade: str = "UN"
) -> str:
    """Cria um item mínimo em ESTOQUE (código, descrição, unidade, preço de
    venda, quantidade, situação) — mesmo estado em que ficaria um cadastro
    rápido manual pela tela do GDOOR. Campos fiscais (NCM, ICMS, PIS/COFINS
    etc.) ficam em branco; o dono completa depois no GDOOR se for emitir nota
    fiscal com esse item."""
    con = _conectar()
    try:
        cur = con.cursor()
        codigo = proximo_codigo_estoque()
        cur.execute(
            """
            INSERT INTO ESTOQUE (
                CODIGO, DESCRICAO, UND, PRECO_VENDA, QTD, SITUACAO, DATA_CADASTRO
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (codigo, descricao, unidade, preco_venda, qtd, "Ativo", date.today()),
        )
        con.commit()
        return codigo
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def _para_float(valor) -> float | None:
    """LAT/LON de CLIENTE são VARCHAR no GDOOR (não numérico) — texto livre
    digitado, pode vir vazio/inválido."""
    if valor is None:
        return None
    texto = str(valor).strip().replace(",", ".")
    if not texto:
        return None
    try:
        return float(texto)
    except ValueError:
        return None


def listar_clientes(limite: int = 3000) -> list[dict]:
    """Catálogo de clientes do GDOOR (tabela CLIENTE, cadastro persistente —
    diferente de PDV_CLIENTE, que é só o registro por venda usado na
    pré-venda). Exclui o código '000000' (Consumidor genérico do PDV, não é
    cliente de verdade). Alimenta o modal de sincronização de clientes."""
    con = _conectar()
    try:
        cur = con.cursor()
        cur.execute(
            f"""
            SELECT FIRST {limite}
                CODIGO, NOME, CNPJ_CNPF, TELEFONE, CELULAR, EMAIL,
                ENDERECO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, UF, CEP, LAT, LON
            FROM CLIENTE
            WHERE CODIGO <> '000000'
            ORDER BY NOME
            """
        )
        itens = []
        for codigo, nome, cnpj_cnpf, telefone, celular, email, endereco, numero, complemento, bairro, cidade, uf, cep, lat, lon in cur.fetchall():
            if not codigo:
                continue
            itens.append({
                "codigo": codigo.strip(),
                "nome": (nome or "").strip() or None,
                "cnpj_cnpf": (cnpj_cnpf or "").strip() or None,
                "telefone": (celular or telefone or "").strip() or None,
                "email": (email or "").strip() or None,
                "endereco": (endereco or "").strip() or None,
                "numero": (numero or "").strip() or None,
                "complemento": (complemento or "").strip() or None,
                "bairro": (bairro or "").strip() or None,
                "cidade": (cidade or "").strip() or None,
                "uf": (uf or "").strip() or None,
                "cep": (cep or "").strip() or None,
                "lat": _para_float(lat),
                "lon": _para_float(lon),
            })
        return itens
    finally:
        con.close()


def proximo_codigo_cliente() -> str:
    """CLIENTE.CODIGO também não tem gerador — mesmo cálculo sequencial de
    proximo_codigo_estoque(). Seguro pelo mesmo motivo: poller processa um
    job por vez."""
    con = _conectar()
    try:
        cur = con.cursor()
        cur.execute("SELECT CODIGO FROM CLIENTE")
        numericos = []
        largura = 6
        for (codigo,) in cur.fetchall():
            if not codigo:
                continue
            codigo = codigo.strip()
            if codigo.isdigit():
                numericos.append(int(codigo))
                largura = max(largura, len(codigo))
        proximo = (max(numericos) + 1) if numericos else 1
        return str(proximo).zfill(largura)
    finally:
        con.close()


def criar_cliente(
    nome: str,
    cnpj_cnpf: str | None = None,
    telefone: str | None = None,
    email: str | None = None,
    endereco: str | None = None,
    numero: str | None = None,
    complemento: str | None = None,
    bairro: str | None = None,
    cidade: str | None = None,
    uf: str | None = None,
    cep: str | None = None,
) -> str:
    """Cria um cliente mínimo em CLIENTE (código, nome, contato, endereço,
    situação) — mesmo espírito de criar_produto_estoque: campos de
    crédito/fiscal ficam em branco, o dono completa depois no GDOOR se
    precisar (ex.: limite de crédito, tabela de preço)."""
    con = _conectar()
    try:
        cur = con.cursor()
        codigo = proximo_codigo_cliente()
        cur.execute(
            """
            INSERT INTO CLIENTE (
                CODIGO, NOME, CNPJ_CNPF, TELEFONE, EMAIL,
                ENDERECO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, UF, CEP,
                SITUACAO, CADASTRO
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                codigo, nome, cnpj_cnpf, telefone, email,
                endereco, numero, complemento, bairro, cidade, uf, cep,
                "Ativo", date.today(),
            ),
        )
        con.commit()
        return codigo
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def produto_existe(codigo_gdoor: str) -> bool:
    con = _conectar()
    try:
        cur = con.cursor()
        cur.execute("SELECT 1 FROM ESTOQUE WHERE CODIGO = ?", (codigo_gdoor,))
        return cur.fetchone() is not None
    finally:
        con.close()


def ler_cnpj_emitente() -> str | None:
    """CNPJ cadastrado no GDOOR local (tabela EMITENTE, linha única) — usado como
    identificador da instalação, conferido contra o CNPJ esperado cadastrado no
    painel do restaurante (não existe campo "SERIAL" dedicado no GDOOR)."""
    con = _conectar()
    try:
        cur = con.cursor()
        cur.execute("SELECT CNPJ FROM EMITENTE")
        row = cur.fetchone()
        return row[0].strip() if row and row[0] else None
    finally:
        con.close()
