-- Mesmo prejuízo de taxa de cartão não cobrada (ver taxa_cartao_prejuizo em
-- comanda_pagamentos, migration 20260906000002), mas pro pagamento FINAL da comanda
-- (endpoint `pagar`, salao-pdv.service.ts) — esse fechamento não passa por
-- comanda_pagamentos, grava direto em orders.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS taxa_cartao_prejuizo_valor NUMERIC(10,2);
