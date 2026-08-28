import uuid
from dataclasses import dataclass
from datetime import date, datetime, time
from decimal import ROUND_DOWN, Decimal

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


CLIENTE_CODIGO_CONSUMIDOR = "000000"


def produtos_sem_fiscal_completo(codigos: list[str]) -> list[str]:
    """Confere NCM (COD_NCM) e CST/CSOSN (ST) preenchidos no ESTOQUE — sem os
    dois, a pré-venda até é gravada mas trava na hora de concluir/emitir no
    GDOOR. Retorna os códigos que ainda faltam completar."""
    if not codigos:
        return []
    con = _conectar()
    try:
        cur = con.cursor()
        incompletos = []
        for codigo in set(codigos):
            cur.execute("SELECT COD_NCM, ST FROM ESTOQUE WHERE CODIGO = ?", (codigo,))
            row = cur.fetchone()
            if not row or not (row[0] or "").strip() or not (row[1] or "").strip():
                incompletos.append(codigo)
        return incompletos
    finally:
        con.close()


def _gerar_blob_pdv_arqbin(cur, venda_id: int) -> bytes:
    """PDV_ARQBIN.OBJETO — dump em texto puro (`Objeto.Campo=valor`, uma linha
    por campo, `\\r\\n`) do objeto de venda que a tela do GDOOR usa pra
    recarregar a pré-venda ao abrir "Alterar"/"Concluir"/"Processar". Sem essa
    linha a tela some com o registro, sem erro, ao tentar concluir/alterar —
    era exatamente essa a peça final que faltava (as outras tabelas —
    VENDAS_NUMERO_DOC, PREVENDA_MOV — bastam pra tela LISTAR e ABRIR a
    pré-venda, mas não pra concluir/salvar alterações).

    Descoberta comparando byte a byte o PDV_ARQBIN de pré-vendas 100% criadas
    pela tela do GDOOR (venda_id=27, 30) — formato, ordem e nomes de campo
    confirmados campo a campo contra essas referências (187 linhas,
    idêntico). Alíquotas de tributo aqui são o valor CHEIO (não truncado em 2
    casas como na coluna SQL ITEVENDAS.TRIB_*): confirmado contra a
    referência (`2.13855`, não `2.13`)."""
    cur.execute(
        "SELECT NOTA, DATA_EMISSAO, HORA_SAIDA, OPERADOR, VALOR_TOT_NOTA FROM VENDAS WHERE ID = ?",
        (venda_id,),
    )
    nota, data_emissao, hora_saida, operador, valor_total_nota = cur.fetchone()
    hora = hora_saida.replace(microsecond=0) if hora_saida else time(0, 0, 0)
    dt_emissao = datetime.combine(data_emissao, hora)
    fmt_dt = dt_emissao.strftime("%d/%m/%Y %I:%M:%S %p").lower()

    cur.execute(
        "SELECT ID, CODIGO, DESCRICAO, UND, QTD, VALOR_UNITA, VALOR_LISTA "
        "FROM ITEVENDAS WHERE ID_VENDAS = ? ORDER BY ITEM",
        (venda_id,),
    )
    itens_db = cur.fetchall()

    linhas: list[str] = []

    def add(k, v):
        linhas.append(f"{k}={v}")

    add("VENDA.FID_VENDA", venda_id)
    add("VENDA.FNUMERO", nota)
    add("VENDA.FMODELO", "PV")
    add("VENDA.FSERIE", "001")
    add("VENDA.FCAIXA", "001")
    add("VENDA.FLOJA", "001")
    add("VENDA.FDATA_EMISSAO", fmt_dt)
    add("VENDA.FCANCELADA", "N")
    add("VENDA.FOBS", f"Operador: {operador} |#13#10|")
    add("VENDA.FMSGPROMOCIONAL", f"Operador: {operador} |#13#10|")
    add("VENDA.FVAL_DESC_NoTOT", 0)
    add("VENDA.FVAL_ACRE_NoTOT", 0)
    add("VENDA.FDESCONTO_TEF", 0)
    add("VENDA.FCFOP", "5.102")
    add("VENDA.FOPERACAO", "Venda a Vista")
    add("VENDA.FBASE_CAL_ICMS", 0)
    add("VENDA.FVALOR_ICMS", 0)
    add("VENDA.FBASE_CAL_ICMS_SUB", 0)
    add("VENDA.FVALOR_ICMS_SUB", 0)
    add("VENDA.FVAL_TOT_TRIB", 0)

    trib_est_total = Decimal("0")
    trib_mun_total = Decimal("0")
    trib_fed_total = Decimal("0")
    item_blocos: list[list[str]] = []

    for idx, (item_id, codigo, descricao, und, qtd, valor_unita, valor_lista) in enumerate(itens_db):
        cur.execute(
            "SELECT OST, ST, COD_NCM, COD_CEST, ID_NCM, TIPO_ITEM, IPPT FROM ESTOQUE WHERE CODIGO = ?",
            (codigo,),
        )
        ost, st, cod_ncm, cod_cest, id_ncm, tipo_item, ippt = cur.fetchone()
        st_item = (ost or "").strip() + (st or "").strip()

        cest_codigo = ""
        if cod_cest:
            cur.execute("SELECT CODIGO FROM CEST WHERE ID = ?", (cod_cest,))
            r = cur.fetchone()
            cest_codigo = r[0] if r else ""

        aliq_fed = aliq_est = aliq_mun = Decimal("0")
        if id_ncm is not None:
            cur.execute("SELECT ALIQ_FED_NAC, ALIQ_EST, ALIQ_MUN FROM NCM_TAB WHERE ID = ?", (id_ncm,))
            ncm_row = cur.fetchone()
            if ncm_row:
                aliq_fed, aliq_est, aliq_mun = (Decimal(str(v or 0)) for v in ncm_row)

        base = Decimal(str(valor_lista))
        trib_fed = base * aliq_fed / 100
        trib_est = base * aliq_est / 100
        trib_mun = base * aliq_mun / 100
        trib_tot = trib_fed + trib_est + trib_mun
        trib_fed_total += trib_fed
        trib_est_total += trib_est
        trib_mun_total += trib_mun

        p = f"ITEM_{idx}"
        item_blocos.append([
            f"{p}.FNroITEM={idx + 1}",
            f"{p}.FCODIGO={codigo}",
            f"{p}.FDESCRICAO={descricao}",
            f"{p}.FBARRAS=",
            f"{p}.FUND={(und or 'UN').strip()}",
            f"{p}.FQTD={qtd}",
            f"{p}.FQTD_RESERVADA=0",
            f"{p}.FVALOR_LISTA={valor_lista}",
            f"{p}.FVALOR_CUSTO=0",
            f"{p}.FDESC_ITEM=0",
            f"{p}.FDESC_RATEIO_TOT=0",
            f"{p}.FDESC_RATEIO_PROMO=0",
            f"{p}.FACRE_ITEM=0",
            f"{p}.FACRE_RATEIO=0",
            f"{p}.FTOT_PARCIAL=F1",
            f"{p}.FECF_IND_TRIB=F1",
            f"{p}.FCOD_NCM={(cod_ncm or '').strip()}",
            f"{p}.FCEST={cest_codigo}",
            f"{p}.FFEM=0",
            f"{p}.FIPPT={(ippt or 'T').strip()}",
            f"{p}.FAT=A",
            f"{p}.FiCasasQTD=2",
            f"{p}.FiCasasPreco=2",
            f"{p}.FAT=A",
            f"{p}.FCOD_ANP=",
            f"{p}.FGRADE=",
            f"{p}.FGRADE_SALDO=",
            f"{p}.FNUM_SERIE=",
            f"{p}.FCOMISSAO_PROD=0",
            f"{p}.FPER_COMISSAO=0",
            f"{p}.FVALOR_COMISSAO=0",
            f"{p}.FVALOR_FRETE=0",
            f"{p}.FDATAHORA_LANC={fmt_dt}",
            f"{p}.FCANCELADO=N",
            f"{p}.FIMPRESSO=S",
            f"{p}.FMOSTROU_TELA=S",
            f"{p}.FECF_ERRO=N",
            f"{p}.FPRONTO=S",
            f"{p}.FTIPO_ITEM={(tipo_item or '00 Mercadoria para Revenda').strip()}",
            f"{p}.FCOD_CFOP=001",
            f"{p}.FCFOP=5.102",
            f"{p}.FCF=",
            f"{p}.FST={st_item}",
            f"{p}.FALIQUOTA=0",
            f"{p}.FBASE_CAL_ICMS=0",
            f"{p}.FRED_BASE_CAL_ICMS=0",
            f"{p}.FVALOR_ICMS=0",
            f"{p}.FBASE_CAL_ICMS_SUB=0",
            f"{p}.FVALOR_ICMS_SUB=0",
            f"{p}.FPIS_ST=",
            f"{p}.FPIS_BASE=0",
            f"{p}.FPIS_ALIQ=0",
            f"{p}.FPIS_SUB_BASE=0",
            f"{p}.FPIS_SUB_ALIQ=0",
            f"{p}.FCOFINS_ST=",
            f"{p}.FCOFINS_BASE=0",
            f"{p}.FCOFINS_ALIQ=0",
            f"{p}.FCOFINS_SUB_BASE=0",
            f"{p}.FCOFINS_SUB_ALIQ=0",
            f"{p}.FTRIB_FEDERAL={trib_fed}",
            f"{p}.FTRIB_ESTADUAL={trib_est}",
            f"{p}.FTRIB_MUNICIPAL={trib_mun}",
            f"{p}.FVALOR_TOT_TRI={trib_tot}",
            f"{p}.FBC_FCP=0",
            f"{p}.FP_FCP=0",
            f"{p}.FVL_FCP=0",
            f"{p}.FALIQ_DESONERADO=0",
            f"{p}.FICMS_DESONERADO=0",
            f"{p}.FMOTIVO_DESONERADO=0",
            f"{p}.FLancadoNoDav=N",
            f"{p}.FDataHoraLancDav=30/12/1899",
            f"{p}.PROMO.ID_PROMO=0",
            f"{p}.PROMO.QTD_SALDO={qtd}",
            f"{p}.PROMO.VALOR_DESC=0",
            f"{p}.PROMO.PROMO_MAGIC=0",
            f"{p}.Vendedor.Id=0",
            f"{p}.Vendedor.Nome=",
            f"{p}.Vendedor.Per_Vista=0",
            f"{p}.Vendedor.Per_Prazo=0",
            f"{p}.Vendedor.Per_Servico_Vista=0",
            f"{p}.Vendedor.Cnpj_Cpf=",
            f"{p}.ID_KIT=0",
            f"{p}.FidTabelaPreco=0",
            f"{p}.ICMSMONO_BASE_QBCRET=0",
            f"{p}.ICMSMONO_ALIQ_ADREMICMSRET=0",
            f"{p}.ICMSMONO_VALOR_VICMSRET=0",
            f"{p}.IdTributacao=0",
        ])

    add("VENDA.fVAL_TRIB_EST", trib_est_total)
    add("VENDA.fVAL_TRIB_MUN", trib_mun_total)
    add("VENDA.fVAL_TRIB_FED", trib_fed_total)
    add("VENDA.FValorFrete", 0)
    add("VENDA.FMOVESTOQUE", 0)
    add("VENDA.FMOVFINANCEIRO", 0)
    add("VENDA.FMOVESTOQUEAUTO", 0)
    add("VENDA.FIDPREVENDA", 0)
    add("VENDA.FINDINTERMED", 0)
    add("VENDA.FINFINTERMEDCNPJ", "")
    add("VENDA.FINFINTERMEDIDCADINTTRAN", "")
    add("VENDA.INDPRESENCA", 0)
    add("VENDA.fVAL_FEM", 0)
    add("VENDA.fOPERADOR", operador)
    add("VENDA.FID_OPERADOR", 1)
    add("CLIENTE.CODIGO", "")
    add("CLIENTE.NOME", "")
    add("CLIENTE.CPF_CNPJ", "")
    add("CLIENTE.ENDERECO", "")
    add("CLIENTE.Perc_Convenio", 0)
    add("CLIENTE.Fidelidade", 0)
    add("Vendedor.Id", 0)
    add("Vendedor.Nome", "")
    add("Vendedor.Per_Vista", 0)
    add("Vendedor.Per_Prazo", 0)
    add("Vendedor.Per_Servico_Vista", 0)
    add("Vendedor.Cnpj_Cpf", "")
    add("DOC_importado.IdDav", 0)
    add("DOC_importado.TIPO", "")
    add("DOC_importado.NUMERO", 0)
    add("DOC_importado.MSG", "")
    add("DOC_importado.Consumacao", 0)
    add("DOC_importado.Comissao", 0)
    add("DOC_importado.DataHora_Emissao", "30/12/1899")
    add("DavsImportados.Tipo", 0)
    add("DavsImportados.Comissao_Inicial", 0)
    add("DavsImportados.Comissao", 0)
    add("DavsImportados.AlterouComissao", 0)
    add("DavsImportados.NaoSomarGorjeta", 0)
    add("ECF.DATA_MOV", dt_emissao.strftime("%d/%m/%Y"))
    add("ECF.CCF", "")
    add("ECF.PAFR04_ITENS", "P")
    add("ECF.NUMFAB", "")
    add("ECF.LancarNoCaixa", "N")
    add("NotaManual.NUMFAB", "")
    add("NotaManual.SERIE", "")
    add("NotaManual.SUB_SERIE", "")
    add("NotaManual.LancarNoCaixa", "N")
    add("DFE.AMBIENTE", "")
    add("DFE.TipoEmissao", 0)
    add("DFE.CHAVE", "")
    add("DFE.ServerNro", "")
    add("DFE.Protocolo", "")
    add("DFE.LancarNoCaixa", "N")
    add("DFE.PlanoContas_Caixa", "")
    add("DFE.DataEnvio", "30/12/1899")
    add("VENDA.PROXIMOITEM", 0)
    add("VENDA.TrabalhaComSalaoParceiro", "N")
    add("QTD.fProdutos", len(itens_db))
    for b in item_blocos:
        linhas.extend(b)
    add("QTD.fPagamentos", 1)
    add("PAG_0.fForma", "Dinheiro:")
    add("PAG_0.fValor", valor_total_nota)
    add("PAG_0.fEspecie_Orig", "DINHEIRO")
    add("PAG_0.fECF_Indice", 1)
    add("PAG_0.fGNF", "")
    add("PAG_0.fAprovada", "N")
    add("PAG_0.FGridRow", 0)
    add("PAG_0.FUUID", str(uuid.uuid4()).upper())
    add("PAG_0.FTroca_Debito", "N")
    add("PAG_0.FFidelidade_Debito", "N")
    add("PAG_0.FGdoorPay", "N")
    add("PAG_0.FShipay", "N")
    add("PAG_0.FEmiteNFCe", "N")
    add("QTD.fPRAZO", 0)
    add("QTD.fTEF", 0)
    add("QTD.fMFE", 0)
    add("QTD.fSmart_POS", 0)
    add("Transportadora.FCodigo", "")
    add("Transportadora.FNome", "")
    add("Transportadora.FCNPJ", "")

    texto = "\r\n".join(linhas) + "\r\n"
    return texto.encode("latin1")


def criar_pre_venda(
    cliente_nome: str,
    cliente_cpf_cnpj: str,
    itens: list[ItemParaGravar],
    cliente_codigo_gdoor: str | None = None,
) -> int:
    """Grava pré-venda em VENDAS (MODELO='PV') — confirmado campo a campo
    contra pré-vendas criadas 100% pela própria tela do GDOOR (venda_id=13,
    16, 24, 27), tanto pendentes quanto concluídas.
    O campo que faltava e não aparecia em nenhuma engenharia reversa anterior
    é `NFE_STATUS='Venda Pendente'` (texto literal, é isso que a tela exibe
    na coluna Status — `PROCESSADA=0` sozinho não bastava). PDV_CLIENTE não é
    usado por esse fluxo (conferido: não existe linha lá na referência).

    (Tentativas anteriores erradas: 1) VENDAS.MODELO='PV' sem
    NFE_STATUS/DATA_SAIDA/HORA_SAIDA/SAIDA/NATUREZA/CFOP — grava mas a tela
    fica com Data/Hora/Status em branco; 2) tabela PREVENDA/PREVENDA_ITENS
    (legada/staging, não relacionada) — palpite errado, não é onde a tela lê;
    3) inserir MOV_OPERADORES na criação — essa tabela só existe em vendas JÁ
    CONCLUÍDAS (é o próprio GDOOR que cria ao clicar Concluir), inserir cedo
    demais fazia a tela "tentar processar e voltar" sem terminar.)

    Levanta ValueError se algum item não tiver NCM/CST preenchido no GDOOR."""

    incompletos = produtos_sem_fiscal_completo([i.codigo_gdoor for i in itens])
    if incompletos:
        raise ValueError(
            f"produto(s) sem NCM/CST preenchido no GDOOR (cadastro > Estoque): {incompletos}. "
            "Complete o cadastro fiscal desses itens no GDOOR antes de sincronizar."
        )

    agora = datetime.now()
    hoje = agora.date()
    hora_agora = agora.time().replace(microsecond=0)
    valor_total_nota = round(sum(i.valor_total for i in itens), 2)
    cliente_codigo_gdoor = (cliente_codigo_gdoor or "").strip()
    cliente_codigo = cliente_codigo_gdoor or CLIENTE_CODIGO_CONSUMIDOR
    # Sem cliente sincronizado de verdade (código real do GDOOR), o nome
    # também vai como "Consumidor" — não mistura o código genérico com um
    # nome livre do pedido/comanda (cliente_mesa_nome, nome digitado no
    # checkout etc.), que não é a mesma coisa de um cliente cadastrado.
    nome = (cliente_nome or "Consumidor").strip()[:60] if cliente_codigo_gdoor else "Consumidor"

    con = _conectar()
    try:
        cur = con.cursor()

        cur.execute("SELECT GEN_ID(GEN_VENDAS_ID, 1) FROM RDB$DATABASE")
        venda_id = cur.fetchone()[0]
        nota = str(venda_id).zfill(9)

        cur.execute(
            """
            INSERT INTO VENDAS (
                ID, NOTA, MODELO, SERIE, DATA_EMISSAO, DATA_SAIDA, HORA_SAIDA, LOJA, CAIXA,
                SAIDA, NATUREZA, CFOP, NFE_STATUS, OBSERVACOES,
                DENEGADA, SUBTRAIR_DESONERADO, PROCESSADA, CANCELADA, IMPORTADO,
                CLIENTE, VALOR_TOT_PRO, VALOR_TOT_NOTA, VENDEDOR, OPERADOR
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                'X', 'Venda a Vista', '5.102', 'Venda Pendente', ?,
                0, 0, 0, 0, 0,
                ?, ?, ?, ?, ?
            )
            """,
            (
                venda_id,
                nota,
                config.VENDAS_MODELO,
                config.VENDAS_SERIE,
                hoje,
                hoje,
                hora_agora,
                config.VENDAS_LOJA,
                config.VENDAS_CAIXA,
                f"Operador: {config.VENDAS_OPERADOR}\n\n",
                cliente_codigo,
                valor_total_nota,
                valor_total_nota,
                config.VENDAS_OPERADOR,
                config.VENDAS_OPERADOR,
            ),
        )

        for numero_item, item in enumerate(itens, start=1):
            # ST do item = OST (origem) + ST (CST/CSOSN) do ESTOQUE, concatenados
            # sem separador — confirmado contra duas pré-vendas nativas frescas
            # (venda 24 e 30, mesmo produto 000004: OST='0' + ST='500' = '0500').
            cur.execute("SELECT OST, ST, ID_NCM FROM ESTOQUE WHERE CODIGO = ?", (item.codigo_gdoor,))
            ost_row = cur.fetchone()
            item_st = ((ost_row[0] or "").strip() + (ost_row[1] or "").strip()) if ost_row else ""
            id_ncm = ost_row[2] if ost_row else None

            # "Valor aproximado dos tributos" (Lei 12.741/2012) — sem isso a
            # tela grava normal mas o Concluir trava (confirmado: venda 30,
            # criada 100% pela tela do GDOOR, só tinha essa diferença a mais
            # contra a nossa antes desse fix). Alíquotas vêm da tabela IBPT
            # interna do GDOOR (NCM_TAB, ligada por ESTOQUE.ID_NCM), truncadas
            # em 2 casas — não arredondadas (conferido: 15.90 * 13.45% =
            # 2.13855, a tela grava 2.13, não 2.14).
            trib_federal = trib_estadual = trib_municipal = Decimal("0.00")
            if id_ncm is not None:
                cur.execute(
                    "SELECT ALIQ_FED_NAC, ALIQ_EST, ALIQ_MUN FROM NCM_TAB WHERE ID = ?", (id_ncm,)
                )
                ncm_row = cur.fetchone()
                if ncm_row:
                    base = Decimal(str(item.valor_total))
                    aliq_fed, aliq_est, aliq_mun = (Decimal(str(v or 0)) for v in ncm_row)
                    trunca = lambda v: (v * 100).to_integral_value(rounding=ROUND_DOWN) / 100
                    trib_federal = trunca(base * aliq_fed / 100)
                    trib_estadual = trunca(base * aliq_est / 100)
                    trib_municipal = trunca(base * aliq_mun / 100)
            valor_tot_tri = trib_federal + trib_estadual + trib_municipal

            cur.execute("SELECT GEN_ID(GEN_ITEVENDAS_ID, 1) FROM RDB$DATABASE")
            item_id = cur.fetchone()[0]
            cur.execute(
                """
                INSERT INTO ITEVENDAS (
                    ID, ID_VENDAS, NOTA, MODELO, SERIE, DATA_EMISSAO, DATA_SAIDA, HORA_SAIDA,
                    LOJA, CAIXA, ITEM,
                    CODIGO, DESCRICAO, BARRAS, UND, QTD, VALOR_UNITA, VALOR_LISTA,
                    TOTAL_DESCONTO, VALOR_TOTAL, VALOR_TOT_PRO, CANCELADA,
                    COD_CFOP, CFOP, CF, ST, GRADE_QUA, GRADE_DIS, VENDEDOR,
                    PIS_ST, COFINS_ST, NUM_SERIE,
                    VALOR_TOT_TRI, TRIB_FEDERAL, TRIB_ESTADUAL, TRIB_MUNICIPAL
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    0, ?, ?, 0,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?
                )
                """,
                (
                    item_id,
                    venda_id,
                    nota,
                    config.VENDAS_MODELO,
                    config.VENDAS_SERIE,
                    hoje,
                    hoje,
                    hora_agora,
                    config.VENDAS_LOJA,
                    config.VENDAS_CAIXA,
                    numero_item,
                    item.codigo_gdoor,
                    item.descricao,
                    "",
                    item.unidade,
                    item.quantidade,
                    item.valor_unitario,
                    item.valor_unitario,
                    item.valor_total,
                    item.valor_total,
                    "001",
                    "5.102",
                    "",
                    item_st,
                    "",
                    "",
                    "",
                    "  ",
                    "  ",
                    b"",
                    valor_tot_tri,
                    trib_federal,
                    trib_estadual,
                    trib_municipal,
                ),
            )

        # Sem essa linha a tela nem acha o registro pra abrir (Alterar não
        # fazia nada). Confirmado comparando com pré-vendas reais criadas
        # pela própria tela do GDOOR: toda "PV" tem uma linha aqui, mesmo
        # ainda pendente (ex.: venda 24, nunca concluída, já tinha essa linha).
        cur.execute(
            "INSERT INTO VENDAS_NUMERO_DOC (NOTA, SERIE, MODELO, ID_VENDAS) VALUES (?, ?, ?, ?)",
            (venda_id, config.VENDAS_SERIE, config.VENDAS_MODELO, venda_id),
        )

        # PREVENDA_MOV também existe desde a criação (não só após concluir) —
        # confirmado contra venda 24 (pendente, nunca concluída) que já tinha
        # essa linha com as duas flags zeradas; vendas concluídas (13, 16, 27)
        # tinham as duas em 1. É o "Concluir" do próprio GDOOR que vira essas
        # flags pra 1 (aplica estoque/financeiro) — por isso MOV_OPERADORES
        # NUNCA deve ser inserido por aqui: é o próprio GDOOR que cria essa
        # linha ao concluir, e uma linha pré-existente (erro anterior deste
        # código) fazia o "Concluir" tentar e voltar sem terminar.
        cur.execute(
            "INSERT INTO PREVENDA_MOV (ID, MOV_ESTOQUE, MOV_FINANCEIRO, ID_PREVENDA) "
            "VALUES (GEN_ID(GEN_PREVENDA_MOV_ID, 1), 0, 0, ?)",
            (venda_id,),
        )

        # A peça que faltava de verdade: sem essa linha "Concluir"/"Alterar"
        # não dão erro nenhum, só voltam sem fazer nada — a tela usa esse
        # blob (não as tabelas SQL) pra recarregar a pré-venda inteira.
        # Confirmado ponta a ponta (venda_id=29): só processou depois disso.
        blob = _gerar_blob_pdv_arqbin(cur, venda_id)
        cur.execute(
            "INSERT INTO PDV_ARQBIN (ID_VENDA, OBJETO) VALUES (?, ?)",
            (venda_id, blob),
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
