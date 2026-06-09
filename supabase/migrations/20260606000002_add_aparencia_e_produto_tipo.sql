-- Fase: Página de vendas profissional

-- Configurações visuais do restaurante
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS aparencia JSONB DEFAULT '{}'::jsonb;

-- Tipo do produto: normal, promo (com desconto), combo
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'normal'
    CHECK (tipo IN ('normal', 'promo', 'combo'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS preco_promo NUMERIC(10,2);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false;

-- Índice para busca por tipo
CREATE INDEX IF NOT EXISTS idx_products_tipo ON public.products(tipo);
CREATE INDEX IF NOT EXISTS idx_products_destaque ON public.products(destaque);
