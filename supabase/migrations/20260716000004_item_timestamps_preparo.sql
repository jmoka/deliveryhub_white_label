-- Timestamps pra calcular tempo de espera/preparo por item no KDS (Produção).
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS preparando_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pronto_em TIMESTAMPTZ;
