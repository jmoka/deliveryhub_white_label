-- Taxa de cartão do estabelecimento: acrescentada ao valor cobrado do cliente quando a
-- comanda/mesa é fechada (ou paga parcialmente) com débito ou crédito.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS taxa_cartao_percentual NUMERIC(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.comanda_pagamentos
  ADD COLUMN IF NOT EXISTS taxa_cartao_valor NUMERIC(10,2);
