-- Estabelecimento restaura uma comanda deletada mediante senha: cria uma comanda
-- NOVA clonando os dados/itens (não reabre a linha original, que fica intocada
-- como histórico/auditoria em "Comandas deletadas"). `restaurada_de_id` aponta
-- pra original, mesmo padrão de `reivindicada_de_id` (20261031000001).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS restaurada_de_id INTEGER REFERENCES public.orders(id);

CREATE INDEX IF NOT EXISTS idx_orders_restaurada_de_id ON public.orders(restaurada_de_id);
