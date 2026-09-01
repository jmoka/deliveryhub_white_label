-- Fluxo de repasse iniciado pelo motoboy: ele vê o saldo devido por estabelecimento e
-- solicita o resgate (com nota fiscal opcional + chave PIX), o restaurante confirma o
-- pagamento anexando comprovante. Antes só existia o caminho contrário (dono marca período
-- inteiro como pago manualmente, sem pedido nem PIX nem comprovante — ver motoboy_repasses).

ALTER TABLE public.motoboys ADD COLUMN IF NOT EXISTS chave_pix TEXT;

CREATE TABLE IF NOT EXISTS public.motoboy_repasse_solicitacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  motoboy_id BIGINT NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  valor_solicitado NUMERIC(10,2) NOT NULL,
  -- Snapshot da chave no momento do pedido — histórico não muda se o motoboy trocar a
  -- chave PIX depois de já ter solicitado (o restaurante paga pra chave que viu na hora).
  chave_pix_motoboy TEXT NOT NULL,
  nota_fiscal_url TEXT,
  comprovante_pagamento_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'recusada')),
  motivo_recusa TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  respondido_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_motoboy_repasse_solic_motoboy ON public.motoboy_repasse_solicitacoes(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_motoboy_repasse_solic_restaurant_status ON public.motoboy_repasse_solicitacoes(restaurant_id, status);

ALTER TABLE public.motoboy_repasse_solicitacoes ENABLE ROW LEVEL SECURITY;

-- Acesso só via backend com service role (JwtGuard/MotoboyGuard resolvem motoboyId/
-- restaurantId a partir do token) — mesmo padrão restritivo (sem policy) de motoboy_comissoes.
