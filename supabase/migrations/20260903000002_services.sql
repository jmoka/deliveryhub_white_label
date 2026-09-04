-- Cadastro de serviços do módulo "Serviços" (prestação sob orçamento) — o
-- estabelecimento cadastra o que presta, sem preço fixo (checkout normal não
-- se aplica aqui, é sempre sob orçamento).

CREATE TABLE IF NOT EXISTS public.services (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  categoria TEXT,
  preco_min NUMERIC(10,2),
  preco_max NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_restaurant_active ON public.services(restaurant_id, is_active);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Sem policy pública — CRUD só via RestaurantOwnerGuard (service role); leitura
-- pública (vitrine) passa pelo backend (CatalogoController), nunca client Supabase
-- direto no browser — mesmo padrão restritivo de motoboy_repasse_solicitacoes.
