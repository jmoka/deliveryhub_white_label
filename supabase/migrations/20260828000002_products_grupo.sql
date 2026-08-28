-- "Grupo" do produto pro cardápio impresso (PF, Prato Executivo, Refeição p/
-- 2 pessoas...) — reaproveita a mesma tabela categories já usada pra "minhas
-- categorias"/"categorias da plataforma", só que aqui sempre aponta pra uma
-- categoria PRÓPRIA do restaurante (restaurant_id preenchido), nunca global.
-- Sem tabela nova: o painel "Minhas Categorias" já existente em
-- restaurante-produtos vira o gerenciador desse grupo.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS grupo_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL;
