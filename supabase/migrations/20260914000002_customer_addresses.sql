-- Múltiplos endereços salvos por cliente. customers.address_json/lat/lng continua
-- sendo o "endereço ativo" (lido por estimativa de frete, criação de pedido,
-- impressão) — selecionar/criar um endereço aqui também copia pra customers,
-- então nada nesses fluxos precisa mudar.
CREATE TABLE public.customer_addresses (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  apelido TEXT,
  address_json JSONB NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address_geocode_hash TEXT,
  address_geocoded_at TIMESTAMPTZ,
  lat_ajustado_manualmente BOOLEAN NOT NULL DEFAULT false,
  padrao BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_addresses_customer ON public.customer_addresses(customer_id);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_proprio" ON public.customer_addresses
  FOR ALL TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

CREATE POLICY "admin_gerir_enderecos" ON public.customer_addresses
  FOR ALL TO authenticated USING (public.is_admin());
