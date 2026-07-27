-- Permite cancelar item da fila de produção (Cozinha/Produção) enquanto ainda está
-- "Aguardando Preparo" (status 'enviado') — some das duas telas, que leem o mesmo
-- order_items.status via GET /kds.
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_status_check;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_status_check
  CHECK (status IN ('pendente','enviado','preparando','pronto','cancelado'));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMPTZ;
