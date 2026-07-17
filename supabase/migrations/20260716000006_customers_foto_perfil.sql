-- Foto de perfil do cliente, exibida no avatar do cabeçalho da home e editável em
-- /customer-profile — mesmo padrão de storage público já usado pra imagens de produto.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;
