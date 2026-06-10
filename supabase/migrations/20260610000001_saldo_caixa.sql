-- Saldo físico persistente no caixa entre sessões
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS saldo_caixa DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Registro de como o saldo foi destinado no fechamento
ALTER TABLE public.caixas ADD COLUMN IF NOT EXISTS destinacao_fechamento JSONB;
