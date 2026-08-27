-- Mesmo padrão já usado em restaurants: quando o cliente arrasta o pino manualmente
-- no mapa (porque a geocodificação automática errou o endereço), essa flag impede
-- que um novo save do endereço sobrescreva o pino confirmado com um geocode ruim de novo.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS lat_ajustado_manualmente BOOLEAN NOT NULL DEFAULT false;
