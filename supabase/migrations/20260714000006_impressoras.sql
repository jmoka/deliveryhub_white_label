-- Módulo Salão: impressoras por setor (cozinha, bar, salgados etc)
CREATE TABLE IF NOT EXISTS public.impressoras (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  setor          TEXT NOT NULL,
  tipo_conexao   TEXT NOT NULL DEFAULT 'rede' CHECK (tipo_conexao IN ('local','rede')),
  endereco       TEXT,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_impressoras_restaurant ON public.impressoras (restaurant_id);

ALTER TABLE public.impressoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY impressoras_owner ON public.impressoras
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

-- Produto vinculado à impressora do seu setor
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS impressora_id BIGINT REFERENCES public.impressoras(id) ON DELETE SET NULL;
