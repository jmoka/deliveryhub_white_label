-- Permite ao admin bloquear o login de um usuário (qualquer papel) a partir de
-- /admin/usuarios, sem excluir a conta. Reflete localmente pra listagem não
-- precisar de uma chamada extra à Admin API do Supabase por usuário; a
-- aplicação de verdade (impedir login/refresh) usa supabase.auth.admin
-- .updateUserById(id, { ban_duration }) junto, no mesmo endpoint do backend.
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN NOT NULL DEFAULT false;
