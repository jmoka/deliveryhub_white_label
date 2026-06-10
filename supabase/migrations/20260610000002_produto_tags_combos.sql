-- Migra tipo TEXT → tags TEXT[] nos produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Migra valores existentes (ignora 'normal' e 'combo' — combo vira entidade própria)
UPDATE public.products
SET tags = CASE
  WHEN tipo IN ('mais_vendido', 'promo') THEN ARRAY[tipo]
  ELSE '{}'
END
WHERE tipo IS NOT NULL;

ALTER TABLE public.products DROP COLUMN IF EXISTS tipo;

-- Combos: entidade separada por restaurante
CREATE TABLE IF NOT EXISTS public.combos (
  id          BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  preco_promo DECIMAL(10,2),
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  destaque    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.combo_items (
  id         BIGSERIAL PRIMARY KEY,
  combo_id   BIGINT NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  UNIQUE (combo_id, product_id)
);

-- RLS combos
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico_ver_combos" ON public.combos FOR SELECT USING (is_active = true);
CREATE POLICY "owner_gerir_combos" ON public.combos USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
);
CREATE POLICY "publico_ver_combo_items" ON public.combo_items FOR SELECT USING (true);
CREATE POLICY "owner_gerir_combo_items" ON public.combo_items USING (
  combo_id IN (
    SELECT c.id FROM public.combos c
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE r.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_combos_restaurant ON public.combos(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON public.combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_product ON public.combo_items(product_id);
