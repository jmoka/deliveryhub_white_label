-- Vincula o motoboy a uma conta de cliente (Supabase Auth), quando o cadastro de
-- motoboy é feito por alguém já logado como cliente. Usado pra promover
-- user_profiles.role pra 'motoboy' automaticamente nesse caso.
ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_motoboys_user_id ON public.motoboys (user_id) WHERE user_id IS NOT NULL;
