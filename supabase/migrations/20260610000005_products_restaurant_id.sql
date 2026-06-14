-- Produtos precisam de restaurant_id direto (sem depender de category → restaurant)
-- Necessário para: cardápio público, carrosseis, listagem correta do dono
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS restaurant_id BIGINT REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Popula restaurant_id a partir da categoria (para produtos já existentes em categorias próprias)
UPDATE public.products p
SET restaurant_id = c.restaurant_id
FROM public.categories c
WHERE p.category_id = c.id
  AND c.restaurant_id IS NOT NULL
  AND p.restaurant_id IS NULL;

-- Índice para queries frequentes
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.products(restaurant_id);

-- RLS: dono do restaurante pode gerir seus próprios produtos
DROP POLICY IF EXISTS "owner_gerir_produtos" ON public.products;
CREATE POLICY "owner_gerir_produtos" ON public.products
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );
