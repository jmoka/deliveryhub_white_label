-- Comissão do motoboy configurável por estabelecimento (fixo, percentual sobre o frete, ou por km rodado)
-- + coordenadas geocodificadas do endereço do restaurante (necessário pro cálculo por km).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS motoboy_comissao_tipo TEXT NOT NULL DEFAULT 'fixo'
    CHECK (motoboy_comissao_tipo IN ('fixo','percentual','km')),
  ADD COLUMN IF NOT EXISTS motoboy_comissao_valor_fixo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motoboy_comissao_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motoboy_comissao_valor_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motoboy_comissao_km_fallback NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geocode_falhou BOOLEAN NOT NULL DEFAULT false;
