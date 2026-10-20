-- Pagamento manual (toggle já existente em restaurante-config) passa a ser um
-- módulo gated por plano, mesmo padrão modulo_delivery/inclui_delivery etc:
-- plano declara se cobre, restaurante recebe o flag real (sincronizado na
-- atribuição do plano em PlanosService.atribuirAssinatura), admin pode
-- sobrescrever direto em /admin/empresas independente do plano.
ALTER TABLE public.planos
    ADD COLUMN IF NOT EXISTS inclui_pagamento_manual BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS modulo_pagamento_manual BOOLEAN NOT NULL DEFAULT false;

-- Diferente de um módulo novo (ninguém deve ganhar acesso automático):
-- pagamento_manual já existe e está em uso real. Sem esse backfill, a loja
-- que já opera em modo manual perderia o toggle de restaurante-config (vira
-- invisível) embora o checkout continuasse funcionando do mesmo jeito (lido
-- direto de restaurants.pagamento_manual, não passa pelo módulo) — ela só não
-- conseguiria mais desligar/religar sem o admin liberar o módulo primeiro.
UPDATE public.restaurants SET modulo_pagamento_manual = true WHERE pagamento_manual = true;
