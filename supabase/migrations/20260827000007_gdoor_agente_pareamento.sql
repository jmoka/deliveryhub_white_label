-- Pareamento do agente GDOOR (mesmo padrão de agente_impressao_token/ultimo_ping) —
-- token gerado no painel, colado na config do agente local; heartbeat atualizado
-- como efeito colateral de toda chamada autenticada do agente.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS gdoor_agente_token UUID,
  ADD COLUMN IF NOT EXISTS gdoor_agente_ultimo_ping TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gdoor_cnpj_esperado TEXT,
  ADD COLUMN IF NOT EXISTS gdoor_cnpj_confirmado TEXT;

-- Fila de pedidos pra sincronizar com o GDOOR — mesmo padrão de impressao_jobs.
-- O agente local consome via polling (GET jobs/pendentes), nunca o contrário —
-- server_delivery roda na nuvem e não alcança a máquina do restaurante.
CREATE TABLE IF NOT EXISTS public.gdoor_jobs (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  pedido_id      BIGINT NOT NULL,
  payload        JSONB NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','processado','erro')),
  erro_msg       TEXT,
  venda_id_gdoor TEXT,
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  processado_em  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gdoor_jobs_restaurant_pendente ON public.gdoor_jobs (restaurant_id, status);
