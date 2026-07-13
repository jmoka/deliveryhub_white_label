-- Coordenadas geocodificadas do endereço do cliente, pro cálculo de comissão por km.
-- address_geocode_hash guarda um hash do address_json no momento da geocodificação,
-- pra saber se precisa regeocodificar quando o endereço mudar, sem comparar campo a campo.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS address_geocode_hash TEXT,
  ADD COLUMN IF NOT EXISTS address_geocoded_at TIMESTAMPTZ;
