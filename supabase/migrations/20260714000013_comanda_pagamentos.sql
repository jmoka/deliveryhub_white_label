-- Módulo Salão: pagamentos parciais de uma comanda (garçom ou caixa podem registrar)
CREATE TABLE IF NOT EXISTS public.comanda_pagamentos (
  id             BIGSERIAL PRIMARY KEY,
  order_id       BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  valor          NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL,
  origem         TEXT NOT NULL CHECK (origem IN ('garcom','estabelecimento')),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comanda_pagamentos_order ON public.comanda_pagamentos (order_id);

ALTER TABLE public.comanda_pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY comanda_pagamentos_owner ON public.comanda_pagamentos
  FOR ALL USING (
    order_id IN (
      SELECT id FROM public.orders WHERE restaurant_id IN (
        SELECT id FROM public.restaurants WHERE user_id = auth.uid()
      )
    )
  );
