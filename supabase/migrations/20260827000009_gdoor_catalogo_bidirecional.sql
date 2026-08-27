-- Campos extras no cache de ESTOQUE (pra comparar divergência de nome/preço/qtd
-- no modal) e flag de "não sincronizar" — precisa sobreviver ao refresh do cache
-- (registrarEstoque vira upsert, nunca mais delete+insert total).
ALTER TABLE public.gdoor_estoque_cache
  ADD COLUMN IF NOT EXISTS preco_venda NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS qtd NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS unidade TEXT,
  ADD COLUMN IF NOT EXISTS bloqueado_sync BOOLEAN NOT NULL DEFAULT false;

-- Fila de criação de produto no GDOOR (Delivery -> GDOOR) — mesmo padrão de
-- gdoor_jobs (agente puxa via polling, nunca o backend empurra), separada por
-- ser um domínio diferente (cadastro em ESTOQUE, não pré-venda).
CREATE TABLE IF NOT EXISTS public.gdoor_criar_produto_jobs (
  id                  BIGSERIAL PRIMARY KEY,
  restaurant_id       BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  product_id          BIGINT NOT NULL,
  payload             JSONB NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','processado','erro')),
  codigo_gdoor_criado TEXT,
  erro_msg            TEXT,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  processado_em       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gdoor_criar_produto_pendente ON public.gdoor_criar_produto_jobs (restaurant_id, status);
