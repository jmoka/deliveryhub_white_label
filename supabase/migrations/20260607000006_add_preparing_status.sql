-- Add 'preparing' status between confirmed and ready
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','confirmed','preparing','ready','out_for_delivery','delivered','canceled'));
