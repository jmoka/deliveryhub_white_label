-- Controle de estoque manual do produto, usado no Relatório de Produtos
-- (ajuste feito pelo dono na tela de Produtos, sem decremento automático na venda).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quantidade_estoque INTEGER NOT NULL DEFAULT 0;
