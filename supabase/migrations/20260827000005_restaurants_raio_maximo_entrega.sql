-- Distância máxima (km) que o estabelecimento atende — barreira no checkout pra
-- impedir pedido de endereço longe demais. NULL/0 = sem limite (comportamento atual).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS raio_maximo_entrega_km NUMERIC(10,2);
