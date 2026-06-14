-- Token de acesso para o painel da cozinha (sem precisar de conta de dono)
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS cozinha_token UUID NOT NULL DEFAULT gen_random_uuid();
