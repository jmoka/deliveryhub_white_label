-- Módulo Salão: desconto/acréscimo aplicados pelo caixa na comanda (nunca pelo garçom)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acrescimo_valor NUMERIC(10,2) NOT NULL DEFAULT 0;
