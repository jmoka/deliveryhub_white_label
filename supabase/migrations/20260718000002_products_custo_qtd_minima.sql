-- Preço de custo (pra calcular lucro) e quantidade mínima em estoque
-- (pra relatório de reposição), usados no Relatório de Produtos.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_minima INTEGER NOT NULL DEFAULT 0;
