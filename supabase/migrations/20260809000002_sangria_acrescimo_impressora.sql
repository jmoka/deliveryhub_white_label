-- Impressora dedicada pro recibo de sangria/adição do caixa — opcional, sem ela cai
-- no fallback de impressão do navegador (mesmo padrão do recibo_impressora_id).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS sangria_acrescimo_impressora_id BIGINT REFERENCES public.impressoras(id) ON DELETE SET NULL;
