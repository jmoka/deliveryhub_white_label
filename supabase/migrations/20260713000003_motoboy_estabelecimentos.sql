-- Afiliação N:N entre motoboy e estabelecimento: motoboy solicita, estabelecimento aceita/recusa.
CREATE TABLE IF NOT EXISTS public.motoboy_estabelecimentos (
  id             BIGSERIAL PRIMARY KEY,
  motoboy_id     BIGINT NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','recusado','removido')),
  motivo_recusa  TEXT,
  solicitado_em  TIMESTAMPTZ DEFAULT NOW(),
  respondido_em  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (motoboy_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_motoboy_estab_restaurant_status ON public.motoboy_estabelecimentos (restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_motoboy_estab_motoboy_status ON public.motoboy_estabelecimentos (motoboy_id, status);

ALTER TABLE public.motoboy_estabelecimentos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'motoboy_estabelecimentos'
      AND policyname = 'motoboy_estabelecimentos_owner'
  ) THEN
    EXECUTE 'CREATE POLICY "motoboy_estabelecimentos_owner" ON public.motoboy_estabelecimentos
      FOR ALL USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()))';
  END IF;
END $$;

-- Backfill: relações 1:1 existentes (motoboys.restaurant_id) viram afiliações já aceitas
INSERT INTO public.motoboy_estabelecimentos (motoboy_id, restaurant_id, status, solicitado_em, respondido_em)
SELECT id, restaurant_id, 'aceito', created_at, created_at
FROM public.motoboys
WHERE restaurant_id IS NOT NULL
ON CONFLICT (motoboy_id, restaurant_id) DO NOTHING;
