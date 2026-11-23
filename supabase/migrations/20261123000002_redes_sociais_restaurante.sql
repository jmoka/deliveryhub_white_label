-- Links de redes sociais do estabelecimento (Instagram/Facebook) — usados na
-- mensagem "pedido entregue" (agradecimento + repetir pedido + compartilhar +
-- seguir nas redes), editados na aba Endereço de /restaurante/config junto do
-- resto da identidade do estabelecimento.
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS facebook_url TEXT;
