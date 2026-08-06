-- Força troca de senha no próximo login (usado pelo admin padrão do seed de primeiro boot)
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
