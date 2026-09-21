-- Notificações via Telegram (cliente: pedido confirmado/entregue; motoboy: pedido
-- pronto pra quem já demonstrou interesse). Opt-in: cada conta vincula o próprio
-- chat_id via deep-link do bot (/start <token>) antes de receber qualquer coisa —
-- sem vínculo, envio é silenciosamente pulado.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
ALTER TABLE public.motoboys ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Tabela única compartilhada entre cliente e motoboy (evita duplicar coluna de
-- token em duas tabelas). Token é apagado no resgate (não só marcado usado) e
-- expira sozinho (30min) se nunca for aberto — sem job de limpeza, volume baixo.
CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'motoboy')),
  entidade_id BIGINT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_token ON public.telegram_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_tipo_entidade ON public.telegram_link_tokens(tipo, entidade_id);

-- Só o backend (service_role) acessa essa tabela — geração/resgate de token
-- passa sempre pela API, nunca direto do client. RLS ligado, sem policy
-- (nega tudo pra anon/authenticated, service_role sempre passa por cima do RLS).
ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
