-- Data/hora real do pagamento — orders.created_at é quando a comanda foi aberta,
-- não quando foi paga (comanda pode ficar aberta de um dia pro outro). Sem essa
-- coluna, "comandas fechadas hoje" filtrava por created_at e escondia pagamentos
-- de comandas abertas em dias anteriores.
ALTER TABLE public.orders ADD COLUMN pago_em TIMESTAMPTZ;
