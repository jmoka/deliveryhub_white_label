-- Estabelecimento pode optar por não usar motoboy nenhum (entrega feita pela
-- própria loja) — independente de cobrar frete do cliente ou não, que já é
-- configurável via restaurants.frete_motoboy.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS usa_motoboy BOOLEAN NOT NULL DEFAULT true;

-- Marca explicitamente que um pedido foi entregue pela própria loja, sem
-- motoboy — evita ambiguidade com motoboy_id simplesmente vazio (que também
-- acontece pra pedido ainda aguardando ser pego).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS entrega_propria BOOLEAN NOT NULL DEFAULT false;
