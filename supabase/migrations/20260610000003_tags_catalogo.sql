-- Tags gerenciadas pelo admin; cada tag ativa = 1 carrossel no catálogo
CREATE TABLE IF NOT EXISTS public.tags_catalogo (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  descricao   TEXT,
  is_auto     BOOLEAN NOT NULL DEFAULT false,  -- true = calculado pelo sistema
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tags_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico_ver_tags_ativas" ON public.tags_catalogo
  FOR SELECT USING (ativo = true);

CREATE POLICY "admin_gerir_tags" ON public.tags_catalogo
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed: tags padrão
INSERT INTO public.tags_catalogo (name, slug, descricao, is_auto, ordem) VALUES
  ('Mais Vendidos',  'mais_vendidos', 'Produtos mais pedidos — calculado automaticamente por volume de vendas', true,  1),
  ('Em Promoção',    'em_promocao',   'Produtos marcados pelo restaurante com preço promocional',              false, 2),
  ('Lançamentos',    'lancamentos',   'Produtos novos adicionados pelo restaurante',                           false, 3)
ON CONFLICT (slug) DO NOTHING;
