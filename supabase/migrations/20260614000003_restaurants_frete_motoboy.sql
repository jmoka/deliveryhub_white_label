-- Taxa de entrega por motoboy configurável por restaurante
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS frete_motoboy NUMERIC(10,2) NOT NULL DEFAULT 0;
