-- Registro de repasse (gorjeta + comissão) efetivamente pago ao garçom pelo período
-- consultado no relatório /restaurante/relatorios/garcom. Um repasse por garçom+período
-- evita pagar duas vezes o mesmo intervalo.
CREATE TABLE IF NOT EXISTS public.garcom_repasses (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  garcom_id      BIGINT NOT NULL REFERENCES public.garcons(id) ON DELETE CASCADE,
  periodo_de     TIMESTAMPTZ NOT NULL,
  periodo_ate    TIMESTAMPTZ NOT NULL,
  valor_gorjeta  NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_comissao NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_dinheiro NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_pix      NUMERIC(10,2) NOT NULL DEFAULT 0,
  caixa_id       BIGINT REFERENCES public.caixas(id) ON DELETE SET NULL,
  saida_criado_em TIMESTAMPTZ,
  pago_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (garcom_id, periodo_de, periodo_ate)
);

CREATE INDEX idx_garcom_repasses_restaurant ON public.garcom_repasses (restaurant_id);
CREATE INDEX idx_garcom_repasses_garcom ON public.garcom_repasses (garcom_id);
CREATE INDEX idx_garcom_repasses_pago_em ON public.garcom_repasses (pago_em);

ALTER TABLE public.garcom_repasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY garcom_repasses_owner ON public.garcom_repasses
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );
