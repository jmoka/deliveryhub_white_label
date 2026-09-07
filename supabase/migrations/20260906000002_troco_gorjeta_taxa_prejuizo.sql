-- Dois ajustes financeiros que o garçom/caixa podem marcar antes de fechar a comanda,
-- pra nunca ficar "dinheiro fantasma" sem explicação no fechamento do caixa:
--
-- 1) troco_e_gorjeta: cliente disse "fique com o troco" — o dinheiro não volta pro
--    cliente, vira gorjeta do garçom. Sem essa flag, o valor saía do caixa como "Troco"
--    (implicando devolução ao cliente) e não contava no repasse de gorjeta do garçom.
--
-- 2) taxa_cartao_prejuizo: garçom cobrou no cartão sem incluir a taxa da maquininha (que
--    deveria ter sido repassada ao cliente) — a maquininha desconta a taxa de qualquer
--    jeito, então esse valor é prejuízo do estabelecimento. Guardado à parte de
--    taxa_cartao_valor (que representa taxa efetivamente cobrada do cliente) pra aparecer
--    como um item explicado no fechamento/relatório, não como um furo sem motivo.
ALTER TABLE public.comanda_pagamentos
  ADD COLUMN IF NOT EXISTS troco_e_gorjeta BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS taxa_cartao_prejuizo NUMERIC(10,2);
