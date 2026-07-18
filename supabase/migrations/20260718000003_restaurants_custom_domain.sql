-- Domínio customizado por estabelecimento (ex: restordemo.com), pra abrir o
-- cardápio direto na raiz do domínio em vez de precisar do prefixo /r/:slug.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
