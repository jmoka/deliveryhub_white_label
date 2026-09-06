-- Perfis nomeados de "vagas pagas por carrossel" — admin pode salvar várias
-- configurações completas (ex: "Padrão", "Black Friday") em vez de só
-- sobrescrever o único valor vigente (platform_settings.config.marketplace_slots)
-- toda vez que muda um número.
CREATE TABLE IF NOT EXISTS public.marketplace_boost_vagas_presets (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    config JSONB NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketplace_boost_vagas_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerir_vagas_presets" ON public.marketplace_boost_vagas_presets
    FOR ALL TO authenticated USING (public.is_admin());
