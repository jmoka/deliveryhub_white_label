-- Auto atendimento: cliente pede direto pela mesa via QR, sem depender do garçom.
-- Habilitado/desabilitado pelo próprio estabelecimento (não pelo admin da plataforma,
-- diferente de modulo_delivery/modulo_salao que são controlados via /admin/empresas).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS auto_atendimento_habilitado BOOLEAN NOT NULL DEFAULT false;

-- Token fixo por mesa (não muda a cada comanda, diferente de orders.tracking_token) —
-- precisa existir mesmo com a mesa livre, pra virar o QR físico impresso na mesa.
ALTER TABLE public.mesas
  ADD COLUMN IF NOT EXISTS auto_atendimento_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS mesas_auto_atendimento_token_idx
  ON public.mesas (auto_atendimento_token);

-- Sessão do cliente amarrada à comanda (não à mesa) — libera sozinha quando a comanda
-- fecha. Evita que outra pessoa com o mesmo link físico da mesa consiga mexer no
-- pedido de quem já está sentado ali (mesmo padrão condicional de sessão única já
-- usado em garcons/motoboys, só que aqui o "logout" natural é o fechamento da comanda).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cliente_session_id TEXT,
  ADD COLUMN IF NOT EXISTS cliente_session_expires_at TIMESTAMPTZ;
