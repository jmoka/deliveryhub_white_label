-- GDOOR vira um módulo comprável no pacote, igual Delivery e Salão — restaurante
-- só tem acesso à sincronização GDOOR se o plano dele incluir esse módulo.
ALTER TABLE public.planos
    ADD COLUMN inclui_gdoor BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS modulo_gdoor BOOLEAN NOT NULL DEFAULT false;
