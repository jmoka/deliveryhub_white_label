-- Distância (haversine) usada no cálculo e o valor de excedente efetivamente cobrado
-- nesse pedido — auditoria/relatórios e o que sai impresso na ficha do motoboy.
-- distancia_entrega_km fica NULL quando geocodificação falhou/não foi possível
-- (nesse caso frete_excedente_cobrado é sempre 0 — nunca estima pra cima).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS distancia_entrega_km NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS frete_excedente_cobrado NUMERIC(10,2) NOT NULL DEFAULT 0;
