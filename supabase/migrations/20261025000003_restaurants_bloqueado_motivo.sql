-- Distingue bloqueio manual do admin (/admin/empresas > Bloquear) de bloqueio
-- automático por fatura de plano vencida além da tolerância — mesma coluna
-- `restaurants.bloqueado` já era lida nos dois casos (marketplace, afiliação de
-- motoboy), mas até agora só o admin sabia escrever nela; o atraso de pagamento
-- nunca persistia, só aparecia como aviso no painel do próprio dono.
-- Sem o motivo, PlanosService.sincronizarPeriodo não saberia se é seguro
-- desbloquear automaticamente quando a fatura é paga (podia liberar uma loja
-- que o admin bloqueou por outro motivo).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS bloqueado_motivo TEXT
  CHECK (bloqueado_motivo IS NULL OR bloqueado_motivo IN ('admin', 'fatura'));

-- Loja já bloqueada hoje (antes desta coluna existir) foi bloqueio manual —
-- não tem como saber retroativamente se foi fatura, e tratar como 'admin' é o
-- lado seguro (nunca desbloqueia sozinho algo que não foi este sistema que bloqueou).
UPDATE public.restaurants SET bloqueado_motivo = 'admin' WHERE bloqueado = true AND bloqueado_motivo IS NULL;
