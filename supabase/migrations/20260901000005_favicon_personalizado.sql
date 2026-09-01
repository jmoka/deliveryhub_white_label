-- Favicon personalizado por loja é recurso pago do plano — mesmo padrão de
-- modulo_gdoor: inclui_favicon_personalizado no plano, sincronizado pra
-- restaurants.modulo_favicon_personalizado quando a assinatura é atribuída
-- (também sobrescrevível direto pelo admin em /admin/empresas).

ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS inclui_favicon_personalizado BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS modulo_favicon_personalizado BOOLEAN NOT NULL DEFAULT false;
