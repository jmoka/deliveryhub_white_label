-- Frete embutido por produto ganha a mesma estrutura de "Comissão do Motoboy"
-- (fixo/percentual/km), só que individual por produto — não usa nem mistura
-- com motoboy_comissao_* do restaurante (lógica geral, aplicada a todo pedido
-- com motoboy). Cada produto pesado configura o próprio jeito de calcular.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_frete_embutido_tipo_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_frete_embutido_tipo_check
    CHECK (frete_embutido_tipo IN ('fixo', 'percentual', 'km'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS frete_embutido_valor_fixo NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS frete_embutido_percentual NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS frete_embutido_valor_km NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS frete_embutido_km_fallback NUMERIC(10,2);

-- frete_embutido_valor (coluna genérica anterior) fica sem uso a partir de
-- agora — mantida só pra não quebrar nada que já tenha sido salvo, sem
-- necessidade de dropar.
