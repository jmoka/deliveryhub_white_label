-- Novo status intermediário: motoboy pegou o pedido mas ainda não saiu para entrega
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
    'canceled'
  ));

-- Habilitar Realtime na tabela orders para atualizações instantâneas em todos os painéis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
