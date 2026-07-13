-- O motoboy sempre recebe o frete cobrado do cliente + um adicional (fixo/percentual/km).
-- Guarda o frete repassado separado do adicional, pra dar transparência no dashboard de ganhos.
ALTER TABLE public.motoboy_comissoes
  ADD COLUMN IF NOT EXISTS frete_repassado NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.motoboy_comissoes.valor_base IS 'Valor do ADICIONAL (fixo, ou base pro percentual, ou fallback km) — não inclui o frete repassado.';
COMMENT ON COLUMN public.motoboy_comissoes.comissao_valor IS 'Total pago ao motoboy = frete_repassado + adicional.';
