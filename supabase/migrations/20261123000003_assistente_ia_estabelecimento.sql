-- Módulo "Assistente IA" por estabelecimento: cada loja pode ter seu próprio
-- agente conversacional (WhatsApp e/ou Telegram PRÓPRIOS, não o canal
-- compartilhado do Pediuvai), com prompt customizado, memória de conversa e
-- tools escopadas a si mesma. Gated por plano, mesmo padrão par de colunas já
-- usado em modulo_gdoor/modulo_servicos (ver 20260828000001_modulo_gdoor.sql).

ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS inclui_assistente_ia BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS modulo_assistente_ia BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.assistentes_estabelecimento (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL UNIQUE REFERENCES public.restaurants(id),
  prompt_sistema TEXT,
  ativo_whatsapp BOOLEAN NOT NULL DEFAULT false,
  ativo_telegram BOOLEAN NOT NULL DEFAULT false,
  -- Nome da instância na Evolution API, criada sob demanda por essa loja —
  -- nunca a instância "Pediuvai" compartilhada.
  whatsapp_evolution_instance TEXT,
  whatsapp_connection_status TEXT,
  -- Token do BotFather colado pelo dono, nunca em claro (ver EncryptionService).
  telegram_bot_token_enc TEXT,
  telegram_bot_username TEXT,
  telegram_webhook_secret TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assistentes_estabelecimento ENABLE ROW LEVEL SECURITY;

-- Buffer de memória de conversa — sem embeddings/RAG nessa v1, só as últimas N
-- mensagens por (loja, canal, chat) viram contexto pra próxima chamada à LLM.
CREATE TABLE IF NOT EXISTS public.assistente_conversas (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id),
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'telegram')),
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistente_conversas_contexto
  ON public.assistente_conversas(restaurant_id, canal, chat_id, criado_em);

ALTER TABLE public.assistente_conversas ENABLE ROW LEVEL SECURITY;
