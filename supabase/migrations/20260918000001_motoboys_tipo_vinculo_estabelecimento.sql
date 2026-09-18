-- Adiciona 'estabelecimento' ao tipo de vínculo do motoboy cadastrado pelo
-- restaurante: entrega feita pelo próprio dono, sem cadastro de documentos
-- (veículo/CNH/comprovante). Motoboy 'proprio' + CLT agora também escolhe o
-- transporte: 'proprio' (veículo dele, documentos obrigatórios) ou 'empresa'
-- (veículo do estabelecimento, documentos dispensados) — ver
-- MotoboyService.exigeDocumentos().

ALTER TABLE public.motoboys DROP CONSTRAINT IF EXISTS motoboys_tipo_vinculo_check;
ALTER TABLE public.motoboys
  ADD CONSTRAINT motoboys_tipo_vinculo_check
    CHECK (tipo_vinculo IN ('prestador_servico', 'proprio', 'estabelecimento'));

ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS transporte_clt TEXT
    CHECK (transporte_clt IN ('proprio', 'empresa'));
