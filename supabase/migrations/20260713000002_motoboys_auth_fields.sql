-- Motoboy vira identidade própria (self-service): login com senha, documentos.
-- restaurant_id fica nullable — a relação motoboy<->restaurante passa a ser N:N
-- via motoboy_estabelecimentos (próxima migration).
ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT,
  ADD COLUMN IF NOT EXISTS documento_frente_url TEXT,
  ADD COLUMN IF NOT EXISTS documento_verso_url TEXT,
  ADD COLUMN IF NOT EXISTS comprovante_endereco_url TEXT,
  ADD COLUMN IF NOT EXISTS precisa_completar_cadastro BOOLEAN NOT NULL DEFAULT false;

-- Motoboys existentes (criados antes do login por senha) precisam completar cadastro
-- na primeira vez que acessarem com o link antigo.
UPDATE public.motoboys SET precisa_completar_cadastro = true WHERE password_hash IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS motoboys_email_unique ON public.motoboys (email) WHERE email IS NOT NULL;

ALTER TABLE public.motoboys ALTER COLUMN restaurant_id DROP NOT NULL;
COMMENT ON COLUMN public.motoboys.restaurant_id IS 'Legado (pré N:N) — mantido só para migração de dados. Usar motoboy_estabelecimentos.';
