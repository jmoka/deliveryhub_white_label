-- Torna restaurant_id nullable para suportar categorias globais (plataforma)
ALTER TABLE public.categories ALTER COLUMN restaurant_id DROP NOT NULL;

-- Adiciona colunas de ícone e cores
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon_name TEXT NOT NULL DEFAULT 'Tag',
  ADD COLUMN IF NOT EXISTS color_primary TEXT NOT NULL DEFAULT '#FF441F',
  ADD COLUMN IF NOT EXISTS color_secondary TEXT NOT NULL DEFAULT '#FF7A00';

-- Seed: 9 categorias globais padrão (restaurant_id = NULL)
INSERT INTO public.categories (name, icon_name, color_primary, color_secondary, restaurant_id)
VALUES
  ('Todos',       'LayoutGrid',      '#FF441F', '#FF7A00', NULL),
  ('Pizza',       'Pizza',           '#FF6B35', '#FF8C42', NULL),
  ('Hambúrguer',  'Sandwich',        '#E63946', '#FF6B6B', NULL),
  ('Japonesa',    'Fish',            '#0EA5E9', '#38BDF8', NULL),
  ('Açaí',        'GlassWater',      '#7C3AED', '#A855F7', NULL),
  ('Marmita',     'UtensilsCrossed', '#059669', '#10B981', NULL),
  ('Saudável',    'Leaf',            '#16A34A', '#4ADE80', NULL),
  ('Sorvetes',    'Dessert',         '#DB2777', '#F472B6', NULL),
  ('Padaria',     'Coffee',          '#92400E', '#D97706', NULL)
ON CONFLICT DO NOTHING;

-- RLS: leitura pública de categorias globais
CREATE POLICY IF NOT EXISTS "categorias_globais_public_read"
  ON public.categories FOR SELECT
  USING (restaurant_id IS NULL);
