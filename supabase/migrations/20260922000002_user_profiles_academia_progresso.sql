-- Progresso de "já assisti" da Academia PediuVai (hub de tutoriais em vídeo).
-- Blob JSONB por escopo: { "estabelecimento": { videoId: timestamp }, "motoboy": {...}, "cliente": {...} }
-- Mesmo padrão de user_profiles.favoritos_menu.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS academia_progresso jsonb NOT NULL DEFAULT '{}'::jsonb;
