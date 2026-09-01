-- Faturamento por comissão pra lojas sem split PagBank ativo (recebimento
-- manual ou token próprio sem sub-conta de split). split_ativo em pagamentos
-- registra se aquela venda já teve a comissão descontada automaticamente via
-- split, pra não cobrar de novo na fatura do plano. cobra_comissao liga o
-- comportamento por plano; comissao_valor guarda a parte de comissão dentro
-- do valor total da fatura, separado da mensalidade, pro dono ver o
-- detalhamento.

ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS split_ativo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS cobra_comissao BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.plano_faturas
  ADD COLUMN IF NOT EXISTS comissao_valor NUMERIC(10, 2) NOT NULL DEFAULT 0;
