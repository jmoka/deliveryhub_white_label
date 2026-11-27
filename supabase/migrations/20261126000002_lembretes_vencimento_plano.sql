-- Dedupe do cron de lembrete de vencimento de plano mensal (ver PlanosService.
-- enviarLembretesVencimento). Uma linha por (assinatura, regra, ciclo de
-- renovacao) garante que a mesma regra nao disparo mensagem duas vezes pro
-- mesmo vencimento, mesmo que o cron rode mais de uma vez no mesmo dia.

CREATE TABLE public.lembretes_vencimento_enviados (
    id BIGSERIAL PRIMARY KEY,
    assinatura_id BIGINT NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    dias_offset INTEGER NOT NULL,
    data_referencia DATE NOT NULL,
    enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assinatura_id, dias_offset, data_referencia)
);

CREATE INDEX idx_lembretes_vencimento_assinatura ON public.lembretes_vencimento_enviados(assinatura_id);
