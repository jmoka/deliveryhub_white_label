-- Trilha de auditoria pras trocas de email/senha de outros usuários feitas
-- por admin (suporte manual). Só o backend (service_role, ignora RLS) grava
-- — sem policy de INSERT/UPDATE/DELETE pra authenticated/anon, pra ninguém
-- conseguir forjar uma linha de auditoria client-side.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_criado_em ON public.admin_audit_log(criado_em DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_ver_auditoria" ON public.admin_audit_log
    FOR SELECT TO authenticated USING (public.has_role('admin'));
