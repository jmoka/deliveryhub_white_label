-- Item da comanda ganha estágio intermediário "preparando" entre enviado e pronto,
-- igual ao pipeline confirmed→preparing do delivery — cozinha/bar clica "Iniciar
-- Preparo" pra tirar da fila de espera antes de marcar pronto.
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_status_check;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_status_check
  CHECK (status IN ('pendente','enviado','preparando','pronto'));
