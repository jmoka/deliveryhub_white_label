-- Snapshot dos adicionais escolhidos pelo cliente no item do pedido (id/name/price
-- no momento da compra, não referência viva — igual ao padrão de combo_nome/
-- combo_quantidade: preço do adicional pode mudar depois sem afetar pedido já feito).
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS adicionais JSONB;
