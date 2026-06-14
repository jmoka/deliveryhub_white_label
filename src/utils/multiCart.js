const KEY = 'mcp_multi_cart';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export const cartGet = () => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
};

export const cartAdd = (produto, restaurante) => {
  const cart = cartGet();
  const temPromo = produto.tags?.includes('promo') && produto.preco_promo != null;
  const preco = temPromo ? Number(produto.preco_promo) : Number(produto.price);
  const key = `${restaurante.id}:${produto.id}`;
  const idx = cart.findIndex((i) => i._key === key);
  if (idx >= 0) {
    cart[idx].qty += 1;
  } else {
    cart.push({
      _key: key,
      produto_id: produto.id,
      name: produto.name,
      price: preco,
      image_url: produto.image_url ?? null,
      qty: 1,
      restaurante_id: restaurante.id,
      restaurante_slug: restaurante.slug,
      restaurante_nome: restaurante.name,
      restaurante_frete: parseFloat(restaurante.frete_motoboy ?? 0),
    });
  }
  localStorage.setItem(KEY, JSON.stringify(cart));
  return cart;
};

export const cartRemoveOne = (key) => {
  const cart = cartGet();
  const idx = cart.findIndex((i) => i._key === key);
  if (idx < 0) return cart;
  if (cart[idx].qty > 1) cart[idx].qty -= 1;
  else cart.splice(idx, 1);
  localStorage.setItem(KEY, JSON.stringify(cart));
  return cart;
};

export const cartRemoveAll = (key) => {
  const cart = cartGet().filter((i) => i._key !== key);
  localStorage.setItem(KEY, JSON.stringify(cart));
  return cart;
};

export const cartClear = () => localStorage.removeItem(KEY);

export const cartClearRestaurant = (restauranteId) => {
  const cart = cartGet().filter((i) => i.restaurante_id !== restauranteId);
  if (cart.length === 0) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(cart));
};

export const cartCount = () => cartGet().reduce((s, i) => s + i.qty, 0);
export const cartTotal = () => cartGet().reduce((s, i) => s + i.price * i.qty, 0);
export const cartTotalFmt = () => fmt(cartTotal());

export const cartByRestaurant = () => {
  return cartGet().reduce((acc, item) => {
    const rid = item.restaurante_id;
    if (!acc[rid]) {
      acc[rid] = {
        restaurante_id: rid,
        slug: item.restaurante_slug,
        nome: item.restaurante_nome,
        frete_motoboy: item.restaurante_frete ?? 0,
        items: [],
      };
    }
    acc[rid].items.push(item);
    return acc;
  }, {});
};
