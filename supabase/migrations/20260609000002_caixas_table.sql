-- Tabela de caixas operacionais por restaurante
CREATE TABLE public.caixas (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  nome_operador TEXT NOT NULL,
  valor_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'aberto'
                CHECK (status IN ('aberto', 'fechado', 'expirado')),
  aberto_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechado_em    TIMESTAMPTZ,
  saidas        JSONB NOT NULL DEFAULT '[]',
  resumo        JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_caixas_restaurant_status ON public.caixas (restaurant_id, status);

-- FK em orders para rastrear a qual caixa cada pedido pertence
ALTER TABLE public.orders ADD COLUMN caixa_id INT REFERENCES public.caixas(id) ON DELETE SET NULL;

-- RLS: apenas owner do restaurante acessa seus caixas
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_owner_own_caixas" ON public.caixas
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Service role bypassa RLS (backend usa service_role)
CREATE POLICY "service_role_all_caixas" ON public.caixas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
