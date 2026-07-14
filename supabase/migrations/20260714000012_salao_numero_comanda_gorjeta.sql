-- Módulo Salão: numeração de comanda (sequencial por dia) + config de gorjeta do estabelecimento
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS numero_comanda INTEGER;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS gorjeta_percentual NUMERIC(5,2) NOT NULL DEFAULT 0;
