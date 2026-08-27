-- Cobrança de excedente de distância acima do KM já incluso no frete fixo.
-- valor_km_excedente = 0 é o "desligado" (comportamento atual, sem cobrança extra).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS km_incluso_frete NUMERIC(10,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS valor_km_excedente NUMERIC(10,2) NOT NULL DEFAULT 0;
