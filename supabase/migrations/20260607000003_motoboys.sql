-- Motoboys: tabela + colunas em orders

-- Adiciona role motoboy
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'restaurant_owner', 'customer', 'motoboy'));

-- Tabela de motoboys (acesso via token, sem Supabase Auth obrigatório)
CREATE TABLE IF NOT EXISTS public.motoboys (
  id        BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  phone     TEXT,
  access_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas de rastreamento no pedido
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS motoboy_id         BIGINT REFERENCES public.motoboys(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motoboy_lat         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS motoboy_lng         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS motoboy_location_at TIMESTAMPTZ;

-- RLS
ALTER TABLE public.motoboys ENABLE ROW LEVEL SECURITY;

CREATE POLICY motoboys_owner ON public.motoboys
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );
