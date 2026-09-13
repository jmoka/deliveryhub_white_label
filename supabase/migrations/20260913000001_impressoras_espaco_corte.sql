-- Espaço (em linhas de avanço de papel) deixado no fim de todo ticket/recibo enviado ao
-- agente de impressão local pra essa impressora, antes do corte automático. Configurável
-- por impressora porque a folga necessária varia por modelo/marca — o valor fixo de 3
-- linhas embutido no agente (print-agent/printers.py) não é suficiente em todo hardware.
ALTER TABLE public.impressoras
  ADD COLUMN IF NOT EXISTS espaco_corte_linhas smallint NOT NULL DEFAULT 6;

ALTER TABLE public.impressoras
  ADD CONSTRAINT impressoras_espaco_corte_linhas_check CHECK (espaco_corte_linhas BETWEEN 0 AND 30);
