-- Camada extra de alerta pro motoboy: quando o pedido é enviado pra produção (itens
-- roteados pro KDS), motoboys afiliados veem um card "concorrer a essa entrega?" e podem
-- demonstrar interesse antes do pedido ficar pronto. Quando fica pronto, o alerta final
-- (som + card "pegar pedido") vai só pra quem demonstrou interesse — se ninguém demonstrou
-- a tempo, cai no fallback de alertar todos os afiliados (ver pedidosDisponiveisTodos no
-- backend), pra nenhum pedido ficar sem cobertura.
CREATE TABLE IF NOT EXISTS public.pedido_interesses_motoboy (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  motoboy_id BIGINT NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, motoboy_id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_interesses_motoboy_order ON public.pedido_interesses_motoboy(order_id);
CREATE INDEX IF NOT EXISTS idx_pedido_interesses_motoboy_motoboy ON public.pedido_interesses_motoboy(motoboy_id);

ALTER TABLE public.pedido_interesses_motoboy ENABLE ROW LEVEL SECURITY;

-- Acesso é sempre via backend com service role (JwtGuard/MotoboyGuard resolvem
-- motoboyId/restaurantId a partir do token, nunca do body) — mesma política restritiva
-- (sem policy pra anon/authenticated) já usada nas outras tabelas operacionais do motoboy
-- como motoboy_estabelecimentos.
