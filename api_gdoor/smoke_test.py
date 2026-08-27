import os

os.environ.setdefault("FB_PASSWORD", "masterkey")

from app import firebird_client, mapping  # noqa: E402

mapping.init_db()
mapping.upsert_mapeamento(1, "000001", "Pizza Calabresa")

codigo = mapping.get_codigo_gdoor(1)
assert codigo == "000001", codigo
assert firebird_client.produto_existe(codigo), "produto 000001 deveria existir no ESTOQUE"

itens = [
    firebird_client.ItemParaGravar(
        codigo_gdoor=codigo,
        descricao="Pizza Calabresa",
        quantidade=2,
        valor_unitario=45.90,
    )
]

venda_id = firebird_client.criar_pre_venda(
    cliente_nome="CLIENTE SMOKE TEST PYTHON",
    cliente_cpf_cnpj="98765432100",
    itens=itens,
)
print("venda_id criado:", venda_id)

mapping.registrar_importacao("pedido-smoke-1", venda_id)
assert mapping.venda_id_do_pedido("pedido-smoke-1") == venda_id

print("OK - fluxo completo funcionou")
