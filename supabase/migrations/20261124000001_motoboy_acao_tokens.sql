-- Link de ação de um clique enviado por Telegram/WhatsApp pro motoboy: "concorrer" ao
-- pedido quando ele entra em produção, ou "pegar" quando fica pronto pra retirada — sem
-- precisar abrir/logar no app. Token é apagado no resgate (não só marcado usado), mesmo
-- espírito do telegram_link_tokens; expira sozinho (6h) se nunca for aberto.
CREATE TABLE IF NOT EXISTS public.motoboy_acao_tokens (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  motoboy_id BIGINT NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
  acao TEXT NOT NULL CHECK (acao IN ('concorrer', 'pegar')),
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motoboy_acao_tokens_token ON public.motoboy_acao_tokens(token);

-- Só o backend (service_role) acessa — geração/resgate sempre via API, nunca direto do
-- client. RLS ligado, sem policy (nega tudo pra anon/authenticated).
ALTER TABLE public.motoboy_acao_tokens ENABLE ROW LEVEL SECURITY;
