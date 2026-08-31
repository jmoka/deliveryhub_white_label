-- Entregador precisa declarar o veículo usado (foto + CRLV) e ser MEI
-- obrigatoriamente (MEI caminhoneiro se o veículo for caminhão) — validado
-- por consulta automática a CNPJ. mei_situacao começa 'pendente' e é
-- resolvido (validado/invalido/revisao_manual) no momento do cadastro.

ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS veiculo_tipo TEXT
    CHECK (veiculo_tipo IN ('bicicleta', 'moto', 'carro', 'caminhao', 'carretinha')),
  ADD COLUMN IF NOT EXISTS veiculo_foto_url TEXT,
  ADD COLUMN IF NOT EXISTS veiculo_documento_url TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS mei_situacao TEXT NOT NULL DEFAULT 'pendente'
    CHECK (mei_situacao IN ('pendente', 'validado', 'invalido', 'revisao_manual')),
  ADD COLUMN IF NOT EXISTS mei_cnae_principal TEXT,
  ADD COLUMN IF NOT EXISTS mei_caminhoneiro BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mei_verificado_em TIMESTAMPTZ;
