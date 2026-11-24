-- Link "acompanhar pedido" mandado por Telegram/WhatsApp na confirmação — abre a tela
-- de acompanhamento sem precisar logar (cliente pode estar vendo pelo celular sem app
-- aberto). Diferente do motoboy_acao_tokens: aqui o token NÃO é de uso único (pedido
-- fica em acompanhamento por dias, cliente pode reabrir o link várias vezes), por isso
-- é só leitura (GET /pedidos/acompanhar/:token) e tem UNIQUE(order_id) pra reusar o
-- mesmo token se a mensagem for reenviada.
CREATE TABLE IF NOT EXISTS public.pedido_tracking_tokens (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedido_tracking_tokens_token ON public.pedido_tracking_tokens(token);

-- Só o backend (service_role) acessa — geração/resgate sempre via API, nunca direto do
-- client. RLS ligado, sem policy (nega tudo pra anon/authenticated).
ALTER TABLE public.pedido_tracking_tokens ENABLE ROW LEVEL SECURITY;
