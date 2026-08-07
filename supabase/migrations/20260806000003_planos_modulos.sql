-- Plano passa a declarar quais módulos ele cobre (Delivery e/ou Salão),
-- espelhando as colunas modulo_delivery/modulo_salao já usadas em restaurants.
ALTER TABLE public.planos
    ADD COLUMN inclui_delivery BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN inclui_salao BOOLEAN NOT NULL DEFAULT false;
