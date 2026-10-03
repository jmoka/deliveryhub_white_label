-- Comissão da plataforma (plataforma_comissoes) passa a ser registrada no
-- momento do PAGAMENTO CONFIRMADO (pagamentos.status -> 'paid'), não mais na
-- entrega do pedido. Alinha o admin (/admin/comissoes, dashboard) com o que a
-- tela de Sessão do estabelecimento já faz desde af2d9bb
-- (RestauranteService.calcularFinanceiroPlataformaDelivery): dinheiro que já
-- se moveu (ou já foi "prometido" via split) deve aparecer pros dois lados
-- na hora, sem esperar o pedido virar "entregue".
--
-- Base de cálculo espelha exatamente calcularFinanceiroPlataformaDelivery:
-- exclui frete_cobrado/frete_excedente_cobrado do valor sobre o qual incide
-- a comissão (frete não é receita de venda da plataforma).

DROP TRIGGER IF EXISTS on_order_delivered ON public.orders;
DROP FUNCTION IF EXISTS public.registrar_comissao();

CREATE OR REPLACE FUNCTION public.registrar_comissao_pagamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    pedido RECORD;
    pct NUMERIC(5,2);
    base NUMERIC(10,2);
BEGIN
    IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
        SELECT restaurant_id, total,
               COALESCE(frete_cobrado, 0) + COALESCE(frete_excedente_cobrado, 0) AS frete
          INTO pedido
          FROM public.orders
         WHERE id = NEW.order_id;

        IF NOT FOUND THEN
            RETURN NEW;
        END IF;

        SELECT comissao_pct INTO pct FROM public.restaurants WHERE id = pedido.restaurant_id;
        IF pct IS NULL THEN
            SELECT COALESCE((config->>'comissao_padrao_pct')::numeric, 5.00)
              INTO pct FROM public.platform_settings WHERE id = 1;
        END IF;

        base := GREATEST(0, pedido.total - pedido.frete);

        INSERT INTO public.plataforma_comissoes (empresa_id, pedido_id, valor_venda, comissao_pct, comissao_valor)
        VALUES (pedido.restaurant_id, NEW.order_id, pedido.total, pct, ROUND(base * pct / 100, 2));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pagamento_confirmado ON public.pagamentos;
CREATE TRIGGER on_pagamento_confirmado
    AFTER UPDATE OF status ON public.pagamentos
    FOR EACH ROW EXECUTE FUNCTION public.registrar_comissao_pagamento();

-- Backfill: pagamentos que já estavam 'paid' antes dessa migration (ex.
-- pedido confirmado mas ainda não entregue) nunca vão disparar o UPDATE de
-- novo, então o trigger novo não pega essas vendas sozinho. Insere a
-- comissão retroativamente pra quem está pago e ainda não tem linha.
DO $$
DECLARE
    p RECORD;
    pedido RECORD;
    pct NUMERIC(5,2);
    base NUMERIC(10,2);
BEGIN
    FOR p IN
        SELECT pg.order_id
          FROM public.pagamentos pg
         WHERE pg.status = 'paid'
           AND NOT EXISTS (
               SELECT 1 FROM public.plataforma_comissoes pc WHERE pc.pedido_id = pg.order_id
           )
    LOOP
        SELECT restaurant_id, total,
               COALESCE(frete_cobrado, 0) + COALESCE(frete_excedente_cobrado, 0) AS frete
          INTO pedido
          FROM public.orders
         WHERE id = p.order_id;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        SELECT comissao_pct INTO pct FROM public.restaurants WHERE id = pedido.restaurant_id;
        IF pct IS NULL THEN
            SELECT COALESCE((config->>'comissao_padrao_pct')::numeric, 5.00)
              INTO pct FROM public.platform_settings WHERE id = 1;
        END IF;

        base := GREATEST(0, pedido.total - pedido.frete);

        INSERT INTO public.plataforma_comissoes (empresa_id, pedido_id, valor_venda, comissao_pct, comissao_valor)
        VALUES (pedido.restaurant_id, p.order_id, pedido.total, pct, ROUND(base * pct / 100, 2));
    END LOOP;
END $$;
