-- Separa categoria própria (usada no campo "Categoria" do produto) de grupo
-- próprio (usado no campo "Grupo" / cardápio impresso) — até aqui ambos
-- reaproveitavam a mesma lista de "categories" com restaurant_id preenchido
-- (ver 20260828000002_products_grupo.sql), o que misturava as duas opções no
-- mesmo dropdown. Daqui pra frente cada criação informa o kind.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS kind TEXT CHECK (kind IS NULL OR kind IN ('categoria', 'grupo'));

-- Categorias próprias existentes só podiam ter sido criadas pelo painel
-- "Meus Grupos" (única via de criação antes desta separação) — backfill como grupo.
UPDATE public.categories SET kind = 'grupo' WHERE restaurant_id IS NOT NULL AND kind IS NULL;
