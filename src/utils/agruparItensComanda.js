// Combo vira várias linhas de order_items (uma por produto real que o compõe — ver
// CombosService no backend). Pra exibição, agrupa de volta pelo nome do combo em vez
// de mostrar cada produto como se fosse um item avulso repetindo "combo: X".
export const agruparItensComanda = (itens) => {
  const grupos = [];
  const porCombo = new Map();

  for (const item of itens ?? []) {
    if (item.combo_nome) {
      let grupo = porCombo.get(item.combo_nome);
      if (!grupo) {
        grupo = { tipo: 'combo', nome: item.combo_nome, itens: [] };
        porCombo.set(item.combo_nome, grupo);
        grupos.push(grupo);
      }
      grupo.itens.push(item);
    } else {
      grupos.push({ tipo: 'produto', item });
    }
  }

  return grupos;
};

export const totalGrupoCombo = (grupo) =>
  grupo.itens.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

// Um combo com 2 produtos vira 2 linhas de order_items por unidade comprada — soma só
// as linhas de UM dos produtos (todo produto do combo aparece 1x por unidade comprada,
// então dá o total certo mesmo juntando lotes de compra diferentes do mesmo combo).
export const quantidadeGrupoCombo = (grupo) => {
  const primeiroProduto = grupo.itens[0]?.product_id;
  return grupo.itens
    .filter((i) => i.product_id === primeiroProduto)
    .reduce((acc, i) => acc + (i.combo_quantidade ?? 1), 0);
};
