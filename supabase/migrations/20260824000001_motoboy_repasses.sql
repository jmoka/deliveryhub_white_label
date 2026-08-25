-- Registro de repasse (comissão) efetivamente pago ao motoboy pelo período consultado
-- no relatório /restaurante/relatorios/motoboy. Espelha garcom_repasses, sem valor_gorjeta
-- (motoboy não recebe gorjeta). Um repasse por motoboy+período evita pagar duas vezes o
-- mesmo intervalo.
CREATE TABLE IF NOT EXISTS public.motoboy_repasses (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  motoboy_id     BIGINT NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
  periodo_de     TIMESTAMPTZ NOT NULL,
  periodo_ate    TIMESTAMPTZ NOT NULL,
  valor_comissao NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_dinheiro NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_pix      NUMERIC(10,2) NOT NULL DEFAULT 0,
  caixa_id       BIGINT REFERENCES public.caixas(id) ON DELETE SET NULL,
  saida_criado_em TIMESTAMPTZ,
  pago_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (motoboy_id, periodo_de, periodo_ate)
);

CREATE INDEX idx_motoboy_repasses_restaurant ON public.motoboy_repasses (restaurant_id);
CREATE INDEX idx_motoboy_repasses_motoboy ON public.motoboy_repasses (motoboy_id);
CREATE INDEX idx_motoboy_repasses_pago_em ON public.motoboy_repasses (pago_em);

ALTER TABLE public.motoboy_repasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY motoboy_repasses_owner ON public.motoboy_repasses
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );
