-- Localização ajustada manualmente pelo dono (pino arrastável no mapa) tem prioridade
-- sobre o geocode automático (Nominatim), que é impreciso pra muitos endereços
-- brasileiros (cai em centro de rua/bairro, erro de 100m a 1km+).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS lat_ajustado_manualmente BOOLEAN NOT NULL DEFAULT false;
