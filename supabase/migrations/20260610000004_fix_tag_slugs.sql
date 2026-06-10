-- Alinha slugs de tags_catalogo com os valores já gravados em products.tags[]
-- products.tags usa 'promo' (migrado de tipo='promo'); renomeia em_promocao → promo
UPDATE public.tags_catalogo SET slug = 'promo' WHERE slug = 'em_promocao';

-- products.tags usa 'mais_vendido' (sem 's'); renomeia para manter consistência
-- (carrossel mais_vendidos é auto por order_items COUNT, não usa o slug no array de tags)
-- Mantém 'mais_vendidos' intacto — tag auto não é atribuída via products.tags
