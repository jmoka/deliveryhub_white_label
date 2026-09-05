-- Cobrança via Stripe Connect (destination charge + application_fee_amount,
-- mesmo raciocínio de comissão do split PagBank) — precisa de coluna própria
-- pro webhook (assinado, confiável direto) achar o pagamento pelo intent.
ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'pagbank' CHECK (gateway IN ('pagbank', 'stripe')),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_intent ON public.pagamentos(stripe_payment_intent_id);
