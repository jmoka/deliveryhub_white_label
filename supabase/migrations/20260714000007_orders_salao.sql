-- Módulo Salão: orders ganha canal presencial (mesa/comanda) além do delivery
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS canal TEXT NOT NULL DEFAULT 'delivery' CHECK (canal IN ('delivery','presencial')),
  ADD COLUMN IF NOT EXISTS mesa_id BIGINT REFERENCES public.mesas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS garcom_id BIGINT REFERENCES public.garcons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cliente_mesa_nome TEXT,
  ADD COLUMN IF NOT EXISTS cliente_mesa_telefone TEXT,
  ADD COLUMN IF NOT EXISTS gorjeta_valor NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders (tracking_token);

-- Novos status do fluxo presencial: aberta (comanda em uso), fechada_garcom (aguardando
-- pagamento no caixa), paga (fechada pelo caixa). Mantém todos os status de delivery já existentes.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'motoboy_collecting',
    'out_for_delivery',
    'delivered',
    'canceled',
    'aberta',
    'fechada_garcom',
    'paga'
  ));

-- Módulo Salão: status por item (necessário pra impressão incremental por setor, ideia 11/12)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','enviado','pronto')),
  ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS impressora_id BIGINT REFERENCES public.impressoras(id) ON DELETE SET NULL;
