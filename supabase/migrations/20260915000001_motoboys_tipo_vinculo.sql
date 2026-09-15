-- Motoboy cadastrado direto pelo restaurante ganha um tipo de vínculo:
-- 'prestador_servico' (MEI, CNPJ obrigatório) ou 'proprio' (funcionário do
-- estabelecimento, sem CNPJ). Motoboy próprio pode ser CLT (salário mensal
-- fixo) — nesse caso não gera comissão por corrida (ver ComissaoService).
-- Default 'prestador_servico' preserva o comportamento atual pros motoboys
-- já cadastrados (todos exigiam CNPJ até aqui).

ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS tipo_vinculo TEXT NOT NULL DEFAULT 'prestador_servico'
    CHECK (tipo_vinculo IN ('prestador_servico', 'proprio')),
  ADD COLUMN IF NOT EXISTS motoboy_clt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS documento_cnpj_url TEXT,
  ADD COLUMN IF NOT EXISTS contrato_social_url TEXT;
