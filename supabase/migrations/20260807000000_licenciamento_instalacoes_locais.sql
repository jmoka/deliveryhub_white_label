-- Licenciamento de instalações locais/individuais (fora do SaaS multi-tenant).
-- Generaliza assinaturas/plano_faturas pra aceitarem um titular polimórfico:
-- ou uma loja do SaaS (restaurant_id) ou uma instalação local (instalacao_id).

CREATE TABLE public.instalacoes_locais (
    id BIGSERIAL PRIMARY KEY,
    nome_cliente TEXT NOT NULL,
    contato TEXT,
    serial TEXT NOT NULL UNIQUE,
    dominio_ou_ip TEXT,
    ultimo_check_em TIMESTAMPTZ,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Planos "local" usam só nome/valor/periodicidade/trial — limite_produtos,
-- inclui_delivery/inclui_salao e piso_faturamento ficam sem efeito nesse tipo.
ALTER TABLE public.planos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'saas' CHECK (tipo IN ('saas', 'local'));

-- Titular polimórfico: restaurant_id vira opcional, instalacao_id novo — exatamente um dos dois.
ALTER TABLE public.assinaturas ALTER COLUMN restaurant_id DROP NOT NULL;
ALTER TABLE public.assinaturas DROP CONSTRAINT assinaturas_restaurant_id_key;
ALTER TABLE public.assinaturas ADD COLUMN instalacao_id BIGINT REFERENCES public.instalacoes_locais(id) ON DELETE CASCADE;
ALTER TABLE public.assinaturas ADD CONSTRAINT assinaturas_titular_check
    CHECK ((restaurant_id IS NOT NULL) <> (instalacao_id IS NOT NULL));
CREATE UNIQUE INDEX assinaturas_restaurant_id_idx ON public.assinaturas(restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE UNIQUE INDEX assinaturas_instalacao_id_idx ON public.assinaturas(instalacao_id) WHERE instalacao_id IS NOT NULL;

ALTER TABLE public.plano_faturas ALTER COLUMN restaurant_id DROP NOT NULL;
ALTER TABLE public.plano_faturas ADD COLUMN instalacao_id BIGINT REFERENCES public.instalacoes_locais(id) ON DELETE CASCADE;
ALTER TABLE public.plano_faturas ADD CONSTRAINT plano_faturas_titular_check
    CHECK ((restaurant_id IS NOT NULL) <> (instalacao_id IS NOT NULL));
CREATE INDEX idx_plano_faturas_instalacao ON public.plano_faturas(instalacao_id);
