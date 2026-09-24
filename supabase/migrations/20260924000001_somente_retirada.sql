-- Sem entrega, somente retirada na loja: some a aba "Entrega" no checkout,
-- cliente só vê retirada no balcão. Implica permite_retirada_balcao (UI
-- sincroniza os dois; backend também trata como OR nas validações).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS somente_retirada BOOLEAN NOT NULL DEFAULT false;
