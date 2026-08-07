-- Planos de assinatura da plataforma (mensalidade loja -> plataforma,
-- separado da comissao por venda que ja existia).

CREATE TABLE public.planos (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    periodicidade TEXT NOT NULL CHECK (periodicidade IN ('mensal', 'trimestral', 'anual')),
    limite_produtos INTEGER,                -- NULL = ilimitado
    piso_faturamento NUMERIC(10,2),         -- NULL = sempre cobra
    trial_dias INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,    -- soft-disable, preserva historico
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.assinaturas (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plano_id BIGINT NOT NULL REFERENCES public.planos(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'ativa', 'cancelada')),
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_fim TIMESTAMPTZ,
    ultimo_periodo_faturado_fim TIMESTAMPTZ,  -- controla a geracao lazy de fatura
    data_cancelamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.plano_faturas (
    id BIGSERIAL PRIMARY KEY,
    assinatura_id BIGINT NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    periodo_inicio TIMESTAMPTZ NOT NULL,
    periodo_fim TIMESTAMPTZ NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'isenta', 'cancelada')),
    vencimento TIMESTAMPTZ NOT NULL,
    pago_em TIMESTAMPTZ,
    pagbank_order_id TEXT,
    pix_code TEXT,
    pix_qr_url TEXT,
    reference_id TEXT UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assinatura_id, periodo_inicio)
);

CREATE INDEX idx_plano_faturas_restaurant ON public.plano_faturas(restaurant_id);
CREATE INDEX idx_plano_faturas_status ON public.plano_faturas(status);
CREATE INDEX idx_assinaturas_restaurant ON public.assinaturas(restaurant_id);

-- Comissao por venda: NULL passa a significar "usa padrao global da plataforma"
ALTER TABLE public.restaurants ALTER COLUMN comissao_pct DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.registrar_comissao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    pct NUMERIC(5,2);
BEGIN
    IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
        SELECT comissao_pct INTO pct FROM public.restaurants WHERE id = NEW.restaurant_id;
        IF pct IS NULL THEN
            SELECT COALESCE((config->>'comissao_padrao_pct')::numeric, 5.00)
            INTO pct FROM public.platform_settings WHERE id = 1;
        END IF;
        INSERT INTO public.plataforma_comissoes (empresa_id, pedido_id, valor_venda, comissao_pct, comissao_valor)
        VALUES (NEW.restaurant_id, NEW.id, NEW.total, pct, ROUND(NEW.total * pct / 100, 2));
    END IF;
    RETURN NEW;
END;
$$;
