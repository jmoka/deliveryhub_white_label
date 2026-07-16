-- Endereço estruturado do restaurante (além do campo address livre já existente)
-- pra viabilizar filtro por Estado/Cidade/Bairro/CEP na home pública, junto com o
-- filtro por raio em KM que já usa lat/lng (geocodificado a partir do address).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT;
