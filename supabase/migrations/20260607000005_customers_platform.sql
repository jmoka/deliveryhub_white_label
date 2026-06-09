-- Clientes são da plataforma, não de restaurante específico
-- Remove a coluna restaurant_id que foi adicionada indevidamente

ALTER TABLE public.customers DROP COLUMN IF EXISTS restaurant_id;
DROP INDEX IF EXISTS idx_customers_restaurant_id;
