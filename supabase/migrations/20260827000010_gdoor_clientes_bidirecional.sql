-- Cache de clientes do GDOOR (mesmo padrão de gdoor_estoque_cache) — telefone
-- aqui já vem resolvido (CELULAR ?? TELEFONE) pelo agente, endereço em campos
-- separados (formato original do GDOOR, convertido pra address_json só na
-- hora de importar pro Delivery).
CREATE TABLE IF NOT EXISTS public.gdoor_cliente_cache (
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  codigo         TEXT NOT NULL,
  nome           TEXT,
  cnpj_cnpf      TEXT,
  telefone       TEXT,
  email          TEXT,
  endereco       TEXT,
  numero         TEXT,
  complemento    TEXT,
  bairro         TEXT,
  cidade         TEXT,
  uf             TEXT,
  cep            TEXT,
  lat            NUMERIC,
  lon            NUMERIC,
  bloqueado_sync BOOLEAN NOT NULL DEFAULT false,
  atualizado_em  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (restaurant_id, codigo)
);

-- Mapeamento cliente DeliveryHub -> código GDOOR. customers é global na
-- plataforma (N:N via customer_restaurants), então o mapeamento é por
-- restaurante mesmo assim — o mesmo cliente pode, em teoria, ter código
-- diferente no GDOOR de cada restaurante que ele pediu.
CREATE TABLE IF NOT EXISTS public.gdoor_cliente_mapeamento (
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id    BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  codigo_gdoor   TEXT NOT NULL,
  atualizado_em  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (restaurant_id, customer_id)
);

-- Fila de criação de cliente no GDOOR (Delivery -> GDOOR), mesmo padrão de
-- gdoor_criar_produto_jobs.
CREATE TABLE IF NOT EXISTS public.gdoor_criar_cliente_jobs (
  id                  BIGSERIAL PRIMARY KEY,
  restaurant_id       BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id         BIGINT NOT NULL,
  payload             JSONB NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','processado','erro')),
  codigo_gdoor_criado TEXT,
  erro_msg            TEXT,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  processado_em       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gdoor_criar_cliente_pendente ON public.gdoor_criar_cliente_jobs (restaurant_id, status);
