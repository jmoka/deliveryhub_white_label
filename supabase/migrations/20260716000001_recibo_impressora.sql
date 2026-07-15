-- Impressora padrão pra imprimir o recibo/comanda da venda (pagamento final / venda
-- direta), separada do roteamento por produto (cozinha/bar). Opcional — sem ela, o
-- recibo cai no fallback de impressão do navegador (como já acontecia antes).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS recibo_impressora_id BIGINT REFERENCES public.impressoras(id) ON DELETE SET NULL;
