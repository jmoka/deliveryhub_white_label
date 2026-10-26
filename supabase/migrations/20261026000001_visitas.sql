-- Analytics de visita (admin): IP (criptografado), geo aproximado, duração.
-- empresa_id nulo = visita na home/marketplace, não numa loja específica.
-- Sem restaurant_id pra política de "dono" — essa tabela é admin-only, igual
-- ao padrão de 20261025000001_rls_17_tabelas_expostas.sql (tabelas sem
-- restaurant_id ficam admin-only). Backend sempre escreve/lê via
-- service_role (ignora RLS) — RLS aqui é defesa em profundidade.
CREATE TABLE public.visitas (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES public.restaurants(id) ON DELETE SET NULL,
  ip_cripto TEXT NOT NULL,
  pais TEXT,
  regiao TEXT,
  cidade TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  user_agent TEXT,
  path_inicial TEXT,
  referrer TEXT,
  duracao_segundos INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_visitas_empresa_criado ON public.visitas (empresa_id, criado_em);
CREATE INDEX idx_visitas_criado_em ON public.visitas (criado_em);

ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerir_visitas" ON public.visitas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
