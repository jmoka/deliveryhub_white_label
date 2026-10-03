-- A migration anterior (comissao_por_pagamento_confirmado) trocou o gatilho
-- de comissão pra disparar em pagamentos.status = 'paid'. Isso cobre PIX/
-- cartão via PagBank/Stripe, mas pedido pago em DINHEIRO nunca tem linha na
-- tabela `pagamentos` (ela só existe pra gateway online) -- então esses
-- pedidos nunca disparavam o trigger novo e paravam de gerar comissão,
-- quebrando a cobrança via fatura do plano pra venda em espécie.
--
-- Repõe um trigger de fallback na entrega (como era antes), mas só insere se
-- ainda não existe linha pra aquele pedido -- evita duplicar comissão de
-- pedido online que já foi registrado no pagamento confirmado antes de
-- chegar em "entregue".

CREATE OR REPLACE FUNCTION public.registrar_comissao_entrega()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    pct NUMERIC(5,2);
    base NUMERIC(10,2);
BEGIN
    IF NEW.status = 'delivered' AND OLD.status <> 'delivered'
       AND NOT EXISTS (SELECT 1 FROM public.plataforma_comissoes WHERE pedido_id = NEW.id) THEN
        SELECT comissao_pct INTO pct FROM public.restaurants WHERE id = NEW.restaurant_id;
        IF pct IS NULL THEN
            SELECT COALESCE((config->>'comissao_padrao_pct')::numeric, 5.00)
              INTO pct FROM public.platform_settings WHERE id = 1;
        END IF;

        base := GREATEST(0, NEW.total - COALESCE(NEW.frete_cobrado, 0) - COALESCE(NEW.frete_excedente_cobrado, 0));

        INSERT INTO public.plataforma_comissoes (empresa_id, pedido_id, valor_venda, comissao_pct, comissao_valor)
        VALUES (NEW.restaurant_id, NEW.id, NEW.total, pct, ROUND(base * pct / 100, 2));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_delivered ON public.orders;
CREATE TRIGGER on_order_delivered
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.registrar_comissao_entrega();
