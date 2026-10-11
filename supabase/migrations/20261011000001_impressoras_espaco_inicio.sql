-- Espaço (em linhas de avanço de papel) inserido no INÍCIO de todo ticket/recibo enviado
-- ao agente de impressão local pra essa impressora, antes do conteúdo começar a imprimir.
-- Mesma ideia do espaço de corte (espaco_corte_linhas), mas pra folga no topo em vez do
-- fim — permite reduzir/ajustar o espaço em branco grande que aparece no início da
-- impressão em algumas impressoras, sem afetar o ajuste de corte já existente.
ALTER TABLE public.impressoras
  ADD COLUMN IF NOT EXISTS espaco_inicio_linhas smallint NOT NULL DEFAULT 0;

ALTER TABLE public.impressoras
  ADD CONSTRAINT impressoras_espaco_inicio_linhas_check CHECK (espaco_inicio_linhas BETWEEN 0 AND 30);
