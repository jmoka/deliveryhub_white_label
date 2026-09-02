-- Autenticação em duas etapas (2FA) para admin e dono de restaurante — a
-- coluna fica em user_profiles (não em restaurants) porque precisa cobrir
-- admin, que não tem linha em restaurants. two_factor_method default
-- 'none' garante que contas existentes continuam logando sem nenhuma
-- mudança de comportamento (feature estritamente opt-in).

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS two_factor_method TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS two_factor_totp_secret TEXT;

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_two_factor_method_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_two_factor_method_check
  CHECK (two_factor_method IN ('none', 'totp', 'email'));
