-- Fase 4: vincular clientes a restaurante específico

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS restaurant_id BIGINT REFERENCES public.restaurants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON public.customers(restaurant_id);
