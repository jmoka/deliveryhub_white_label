-- Tela de acompanhamento de vendas Stripe (estabelecimento + admin): valor exato que a
-- loja recebe por venda (tarifa Stripe, comissão da plataforma, líquido) e rastreio de
-- repasse automático via webhook payout.paid (Connect).
ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_taxa_valor NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS comissao_valor NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS valor_liquido_loja NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS stripe_payout_id TEXT,
  ADD COLUMN IF NOT EXISTS repasse_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_transfer ON public.pagamentos(stripe_transfer_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_payout ON public.pagamentos(stripe_payout_id);
