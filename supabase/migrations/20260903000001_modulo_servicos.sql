-- Terceiro módulo de plano, mesmo padrão de modulo_delivery/modulo_salao
-- (20260727000001_modulos_delivery_salao.sql): prestação de serviço sob
-- orçamento — estabelecimento cadastra serviços, cliente pede orçamento na
-- vitrine, sem preço fixo/checkout/chat dentro do app.
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS modulo_servicos BOOLEAN NOT NULL DEFAULT false;

-- Plano passa a declarar se cobre o módulo Serviços, espelhando inclui_delivery/inclui_salao.
ALTER TABLE public.planos
    ADD COLUMN inclui_servicos BOOLEAN NOT NULL DEFAULT false;

-- Sem backfill: módulo novo, ninguém deve ganhar acesso automático.
