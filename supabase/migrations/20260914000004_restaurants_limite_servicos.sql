-- Override de limite de serviços por loja (admin-empresas), independente do
-- plano — mesmo espírito dos módulos boolean (modulo_delivery etc), que também
-- podem ser setados direto pelo admin. NULL = usa o limite do plano da
-- assinatura (ver PlanosService.verificarLimiteServicos).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS limite_servicos INTEGER;
