-- Aprovação de motoboy pela plataforma (admin) — antes de poder ver/solicitar
-- vaga em estabelecimentos, o cadastro precisa ser revisado e aprovado.

ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS status_plataforma TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_plataforma IN ('pendente', 'aprovado', 'recusado')),
  ADD COLUMN IF NOT EXISTS motivo_recusa_plataforma TEXT,
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
  -- Quantas vezes o motoboy já pediu revisão depois de recusado — limite
  -- configurável pelo admin (platform_settings.config.motoboy_limite_revisoes,
  -- default 2), pra não deixar pedir revisão infinitas vezes.
  ADD COLUMN IF NOT EXISTS revisoes_solicitadas INT NOT NULL DEFAULT 0;

-- Motoboys que já existiam antes dessa mudança já estavam ativos/em uso —
-- só cadastros novos daqui pra frente precisam passar por aprovação.
UPDATE public.motoboys SET status_plataforma = 'aprovado', aprovado_em = NOW()
WHERE status_plataforma = 'pendente';
