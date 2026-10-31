-- Garçom precisa ver comandas deletadas pelo estabelecimento e poder reivindicar
-- (reabrir pedindo aprovação). `excluida_em` marca só a exclusão real feita pelo
-- estabelecimento via PDV (cancelar()) — não é setada no "juntar comandas", que
-- também usa status='canceled' mas é consolidação, não exclusão.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS excluida_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reivindicada_de_id INTEGER REFERENCES public.orders(id),
  ADD COLUMN IF NOT EXISTS decisao_reivindicacao TEXT CHECK (decisao_reivindicacao IN ('aprovada', 'recusada')),
  ADD COLUMN IF NOT EXISTS decisao_reivindicacao_em TIMESTAMPTZ;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'motoboy_collecting',
    'out_for_delivery',
    'delivered',
    'canceled',
    'aberta',
    'fechada_garcom',
    'paga',
    'pendente_reivindicacao'
  ));

CREATE INDEX IF NOT EXISTS idx_orders_reivindicada_de_id ON public.orders(reivindicada_de_id);
