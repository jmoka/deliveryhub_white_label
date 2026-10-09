-- Vínculo de Telegram agora também pro estabelecimento (dono recebe aviso de
-- pedido novo por lá) — mesmo padrão opt-in via deep-link já usado pra
-- cliente/motoboy (20260921000001_telegram_notificacoes.sql).

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

ALTER TABLE public.telegram_link_tokens
  DROP CONSTRAINT IF EXISTS telegram_link_tokens_tipo_check;
ALTER TABLE public.telegram_link_tokens
  ADD CONSTRAINT telegram_link_tokens_tipo_check CHECK (tipo IN ('cliente', 'motoboy', 'estabelecimento'));
