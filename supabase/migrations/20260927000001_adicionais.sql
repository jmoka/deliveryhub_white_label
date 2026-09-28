-- Adicionais: itens extras (bacon, cheddar, borda recheada...) que o restaurante
-- cadastra uma vez e reaproveita em quantos produtos quiser. Lista simples (sem
-- grupos/regra de obrigatoriedade) — cliente marca livremente na hora da compra.
CREATE TABLE IF NOT EXISTS public.adicionais (
  id            BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junção produto↔adicional (quais adicionais aquele produto tem disponível)
CREATE TABLE IF NOT EXISTS public.produto_adicionais (
  id           BIGSERIAL PRIMARY KEY,
  product_id   BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  adicional_id BIGINT NOT NULL REFERENCES public.adicionais(id) ON DELETE CASCADE,
  UNIQUE (product_id, adicional_id)
);

ALTER TABLE public.adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_adicionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico_ver_adicionais" ON public.adicionais FOR SELECT USING (is_active = true);
CREATE POLICY "owner_gerir_adicionais" ON public.adicionais USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
);
CREATE POLICY "publico_ver_produto_adicionais" ON public.produto_adicionais FOR SELECT USING (true);
CREATE POLICY "owner_gerir_produto_adicionais" ON public.produto_adicionais USING (
  adicional_id IN (
    SELECT a.id FROM public.adicionais a
    JOIN public.restaurants r ON r.id = a.restaurant_id
    WHERE r.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_adicionais_restaurant ON public.adicionais(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_produto_adicionais_product ON public.produto_adicionais(product_id);
CREATE INDEX IF NOT EXISTS idx_produto_adicionais_adicional ON public.produto_adicionais(adicional_id);
