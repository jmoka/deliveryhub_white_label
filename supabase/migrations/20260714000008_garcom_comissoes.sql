-- Módulo Salão: comissão de garçom (configurável, múltiplas por restaurante) + lançamentos por comanda fechada
CREATE TABLE IF NOT EXISTS public.garcom_comissoes_config (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('percentual','fixo')),
  valor          NUMERIC(10,2) NOT NULL,
  base_calculo   TEXT NOT NULL DEFAULT 'total_vendido' CHECK (base_calculo IN ('total_vendido','total_recebido')),
  ativo          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_garcom_comissoes_config_restaurant ON public.garcom_comissoes_config (restaurant_id);

ALTER TABLE public.garcom_comissoes_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY garcom_comissoes_config_owner ON public.garcom_comissoes_config
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.garcom_comissoes_lancamentos (
  id             BIGSERIAL PRIMARY KEY,
  garcom_id      BIGINT NOT NULL REFERENCES public.garcons(id) ON DELETE CASCADE,
  order_id       BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  config_id      BIGINT REFERENCES public.garcom_comissoes_config(id) ON DELETE SET NULL,
  valor_calculado NUMERIC(10,2) NOT NULL,
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id, config_id)
);

CREATE INDEX idx_garcom_comissoes_lancamentos_garcom ON public.garcom_comissoes_lancamentos (garcom_id);

ALTER TABLE public.garcom_comissoes_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY garcom_comissoes_lancamentos_owner ON public.garcom_comissoes_lancamentos
  FOR ALL USING (
    garcom_id IN (
      SELECT id FROM public.garcons WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE user_id = auth.uid()
      )
    )
  );
