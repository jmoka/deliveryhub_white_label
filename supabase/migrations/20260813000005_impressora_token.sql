-- Token de acesso individual por impressora/setor (KDS). Permite gerar/revogar
-- o acesso de um setor sem afetar os demais nem o token geral da Cozinha.
ALTER TABLE public.impressoras
  ADD COLUMN IF NOT EXISTS token UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_impressoras_token ON public.impressoras (token) WHERE token IS NOT NULL;
