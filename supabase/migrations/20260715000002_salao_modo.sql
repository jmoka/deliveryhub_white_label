-- Modo de venda do salão configurável pelo estabelecimento: só mesas, só comandas
-- avulsas, ou os dois (comportamento atual, mantido como default).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS salao_modo TEXT NOT NULL DEFAULT 'ambos'
    CHECK (salao_modo IN ('mesas','comandas','ambos'));
