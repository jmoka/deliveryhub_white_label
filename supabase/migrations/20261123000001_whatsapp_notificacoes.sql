-- Notificações via WhatsApp (cliente: pedido confirmado/entregue/saiu pra entrega;
-- motoboy: pedido pronto pra quem já demonstrou interesse; estabelecimento: pedido
-- novo). Mesmo padrão opt-in do Telegram (20260921000001/20261009000001): cada conta
-- vincula o próprio chat via deep-link (wa.me com "/start <token>" pré-preenchido)
-- antes de receber qualquer coisa — sem vínculo, envio é silenciosamente pulado.
--
-- chat_id aqui é o JID do WhatsApp (ex. "5591999999999@s.whatsapp.net"), não um
-- telefone digitado — vem direto do payload da Evolution API no resgate do token,
-- então nunca tem erro de formatação/DDD. TEXT em vez de BIGINT (diferente do
-- Telegram, que usa chat_id numérico).

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp_chat_id TEXT;
ALTER TABLE public.motoboys ADD COLUMN IF NOT EXISTS whatsapp_chat_id TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS whatsapp_chat_id TEXT;

CREATE TABLE IF NOT EXISTS public.whatsapp_link_tokens (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'motoboy', 'estabelecimento')),
  entidade_id BIGINT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_link_tokens_token ON public.whatsapp_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_whatsapp_link_tokens_tipo_entidade ON public.whatsapp_link_tokens(tipo, entidade_id);

-- Só o backend (service_role) acessa essa tabela — geração/resgate de token
-- passa sempre pela API, nunca direto do client. RLS ligado, sem policy
-- (nega tudo pra anon/authenticated, service_role sempre passa por cima do RLS).
ALTER TABLE public.whatsapp_link_tokens ENABLE ROW LEVEL SECURITY;
