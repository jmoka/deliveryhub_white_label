-- Agente de impressão local: pareamento do restaurante com o app Python
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS agente_impressao_token UUID,
  ADD COLUMN IF NOT EXISTS agente_impressao_ultimo_ping TIMESTAMPTZ;

-- Identificador exato da impressora no sistema operacional (reportado pelo agente)
ALTER TABLE public.impressoras
  ADD COLUMN IF NOT EXISTS nome_sistema TEXT;

-- Cache do que o agente detectou na máquina, pra alimentar o dropdown de escolha
CREATE TABLE IF NOT EXISTS public.impressoras_detectadas (
  id            BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  nome_sistema  TEXT NOT NULL,
  detectado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, nome_sistema)
);

ALTER TABLE public.impressoras_detectadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY impressoras_detectadas_owner ON public.impressoras_detectadas
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

-- Fila de trabalhos de impressão consumida pelo agente local
CREATE TABLE IF NOT EXISTS public.impressao_jobs (
  id            BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  impressora_id BIGINT NOT NULL REFERENCES public.impressoras(id) ON DELETE CASCADE,
  conteudo      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','impresso','erro')),
  erro_msg      TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  impresso_em   TIMESTAMPTZ
);

CREATE INDEX idx_impressao_jobs_pendentes ON public.impressao_jobs (restaurant_id, status);

ALTER TABLE public.impressao_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY impressao_jobs_owner ON public.impressao_jobs
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );
