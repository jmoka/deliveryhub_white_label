-- Relacionamento N:N entre clientes e restaurantes
-- Um cliente pode pedir em vários restaurantes; cada restaurante vê só seus clientes

CREATE TABLE IF NOT EXISTS public.customer_restaurants (
  customer_id  BIGINT NOT NULL REFERENCES public.customers(id)   ON DELETE CASCADE,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_cr_restaurant ON public.customer_restaurants(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cr_customer   ON public.customer_restaurants(customer_id);

ALTER TABLE public.customer_restaurants ENABLE ROW LEVEL SECURITY;

-- Dono do restaurante vê seus clientes
CREATE POLICY "owner_ver_cr" ON public.customer_restaurants
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Popula automaticamente ao criar pedido (quando customer_id existe)
CREATE OR REPLACE FUNCTION public.fn_link_customer_restaurant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    INSERT INTO public.customer_restaurants (customer_id, restaurant_id)
    VALUES (NEW.customer_id, NEW.restaurant_id)
    ON CONFLICT (customer_id, restaurant_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_link_customer_restaurant ON public.orders;
CREATE TRIGGER trg_link_customer_restaurant
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_link_customer_restaurant();

-- Backfill: vincular clientes que já têm pedidos
INSERT INTO public.customer_restaurants (customer_id, restaurant_id)
SELECT DISTINCT customer_id, restaurant_id
FROM   public.orders
WHERE  customer_id IS NOT NULL
ON CONFLICT DO NOTHING;
