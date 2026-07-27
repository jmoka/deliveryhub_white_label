-- Admin decide por empresa quais módulos ficam liberados (independente do tipo de
-- estabelecimento): Delivery e/ou Salão (mesas/comandas/garçons/produção/bar).
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS modulo_delivery BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS modulo_salao BOOLEAN NOT NULL DEFAULT false;

-- Backfill: preserva o comportamento atual de quem já está cadastrado.
-- Delivery já era liberado pra todo mundo. Salão só quem é tipo "Restaurante" via type_id.
UPDATE public.restaurants
SET modulo_delivery = true;

UPDATE public.restaurants
SET modulo_salao = true
WHERE type_id = (SELECT id FROM public.establishment_types WHERE name = 'Restaurante');
