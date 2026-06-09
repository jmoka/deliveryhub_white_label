-- Configurações globais da plataforma (admin)
-- Armazena token PagBank marketplace + account_id + outras configs globais
CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  config jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Garante que sempre existe exatamente 1 linha
INSERT INTO platform_settings (id, config)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;
