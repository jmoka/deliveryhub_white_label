-- Tela de chamada da Venda Balcão: identifica pedido de balcão (sem mesa/garçom) e
-- controla o ciclo de chamada (bipe+pisca a cada 7s, até 5 chamados) que roda no
-- painel do Salão até o operador marcar como entregue.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_venda_balcao BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chamado_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_chamada_em TIMESTAMPTZ;
