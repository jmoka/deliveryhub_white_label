-- Módulo Salão: mesas físicas do restaurante (modo "por mesa")
CREATE TABLE IF NOT EXISTS public.mesas (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  numero         INTEGER NOT NULL,
  nome           TEXT,
  status         TEXT NOT NULL DEFAULT 'livre'
                 CHECK (status IN ('livre','ocupada','aguardando_pagamento')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurant_id, numero)
);

CREATE INDEX idx_mesas_restaurant ON public.mesas (restaurant_id);

ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY mesas_owner ON public.mesas
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );
