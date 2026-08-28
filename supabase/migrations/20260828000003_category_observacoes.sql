-- Observação por categoria específica do restaurante (ex.: "Acompanha arroz e
-- feijão"), exibida no final da listagem dessa categoria no cardápio impresso.
-- Separada de categories porque a categoria pode ser da PLATAFORMA
-- (compartilhada entre restaurantes) — a observação é sempre só deste dono.
CREATE TABLE IF NOT EXISTS public.category_observacoes (
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id   BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  observacao    TEXT NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (restaurant_id, category_id)
);
