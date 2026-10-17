-- Serviço ganha destaque igual produto já tinha — usado no filtro "Destacados"
-- da loja (storefront), que agora cobre produto e serviço juntos.
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS destaque BOOLEAN NOT NULL DEFAULT false;
