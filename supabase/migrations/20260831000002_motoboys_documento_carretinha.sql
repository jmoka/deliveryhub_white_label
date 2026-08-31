-- Carretinha é puxada por um carro — precisa dos dois documentos: o CRLV do
-- carro (já cai em veiculo_documento_url) e o CRLV da própria carretinha.

ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS veiculo_documento_carretinha_url TEXT;
