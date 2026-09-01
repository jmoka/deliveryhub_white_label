-- Limite de impressoras por plano, mesmo padrão de limite_produtos (NULL =
-- ilimitado).

ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS limite_impressoras INTEGER;
