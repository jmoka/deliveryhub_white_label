-- Limite de serviços por plano, mesmo padrão de limite_produtos/limite_impressoras
-- (NULL = ilimitado).

ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS limite_servicos INTEGER;
