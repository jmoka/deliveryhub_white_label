-- Tabela de pagamentos — rastreia transações PagBank por pedido

CREATE TABLE IF NOT EXISTS public.pagamentos (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    pagbank_order_id TEXT,
    pagbank_charge_id TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'credit_card', 'debit_card')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'declined', 'canceled', 'refunded')),
    valor NUMERIC(10,2) NOT NULL,
    pix_code TEXT,
    pix_qr_url TEXT,
    checkout_url TEXT,
    pago_em TIMESTAMPTZ,
    webhook_recebido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_order ON public.pagamentos(order_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pagbank_order ON public.pagamentos(pagbank_order_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_charge ON public.pagamentos(pagbank_charge_id);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerir_pagamentos" ON public.pagamentos
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "usuario_ver_pagamentos_proprios" ON public.pagamentos
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
    ));
