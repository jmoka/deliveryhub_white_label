// Agrupa itens de KDS (getKdsItensRestaurante/getKdsItens) do mesmo pedido de delivery
// num card só por praça (padrão PedidoDeliveryCard) — itens de salão continuam avulsos
// (SalaoItemCard), mesma fila ordenada por chegada. Usado em Produção, Bar e Cozinha,
// pra nunca divergir o critério de agrupamento entre as praças.
//
// ordenarPor: 'enviado_em' (padrão, mais antigo primeiro — filas de aguardando/preparando)
// ou 'pronto_em' (mais recente primeiro — coluna de entregues/prontos).
export function montarFilaAgrupadaDelivery(itensDoBucket, ordenarPor = 'enviado_em') {
  const grupos = new Map();
  const entradas = [];
  for (const item of itensDoBucket) {
    if (item.tipo !== 'delivery') {
      const ts = new Date(ordenarPor === 'pronto_em' ? item.pronto_em : item.enviado_em).getTime();
      entradas.push({ tipo: 'salao', ts, item });
      continue;
    }
    const tsEnvio = new Date(item.enviado_em).getTime();
    const tsPronto = item.pronto_em ? new Date(item.pronto_em).getTime() : tsEnvio;
    let grupo = grupos.get(item.order_id);
    if (!grupo) {
      grupo = {
        tipo: 'delivery',
        tsEnvio,
        tsPronto,
        pedido: {
          id: item.order_id,
          customers: { name: item.cliente },
          created_at: item.enviado_em,
          payment_method: item.pedido_payment_method,
          total: item.pedido_total,
          outras_pracas: item.outras_pracas ?? [],
        },
        itens: [],
        itemIds: [],
      };
      grupos.set(item.order_id, grupo);
    } else {
      if (tsEnvio < grupo.tsEnvio) { grupo.tsEnvio = tsEnvio; grupo.pedido.created_at = item.enviado_em; }
      if (tsPronto > grupo.tsPronto) grupo.tsPronto = tsPronto;
    }
    grupo.itens.push({ id: item.id, quantity: item.quantity, product_name: item.product_name });
    grupo.itemIds.push(item.id);
  }
  const todas = [...entradas, ...grupos.values()];
  return ordenarPor === 'pronto_em'
    ? todas.sort((a, b) => (b.ts ?? b.tsPronto) - (a.ts ?? a.tsPronto))
    : todas.sort((a, b) => (a.ts ?? a.tsEnvio) - (b.ts ?? b.tsEnvio));
}
