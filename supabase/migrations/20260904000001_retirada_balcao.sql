-- Retirada no balcão: estabelecimento sem motoboy pode oferecer retirada como
-- alternativa à entrega, sem cobrar frete. Independente de usa_motoboy — mesmo
-- quem tem entrega própria pode querer oferecer retirada também.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS permite_retirada_balcao BOOLEAN NOT NULL DEFAULT false;

-- Marca o pedido como retirada no balcão (sem frete, sem motoboy) — canal
-- continua 'delivery' (veio do carrinho online, não do PDV presencial), essa
-- coluna só diz como ele vai ser entregue.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS retirada_balcao BOOLEAN NOT NULL DEFAULT false;
