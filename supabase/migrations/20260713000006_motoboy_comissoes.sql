-- Uma linha por entrega concluída — alimenta o dashboard de ganhos do motoboy
-- (agregado por restaurant_id = ganhos por estabelecimento; listagem = histórico por entrega).
CREATE TABLE IF NOT EXISTS public.motoboy_comissoes (
  id             BIGSERIAL PRIMARY KEY,
  motoboy_id     BIGINT NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  pedido_id      BIGINT NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('fixo','percentual','km','km_fallback')),
  valor_base     NUMERIC(10,2) NOT NULL DEFAULT 0,
  percentual     NUMERIC(5,2),
  distancia_km   NUMERIC(6,2),
  valor_por_km   NUMERIC(10,2),
  comissao_valor NUMERIC(10,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  pago_em        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_motoboy_comissoes_motoboy ON public.motoboy_comissoes (motoboy_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_motoboy_comissoes_motoboy_rest ON public.motoboy_comissoes (motoboy_id, restaurant_id);
