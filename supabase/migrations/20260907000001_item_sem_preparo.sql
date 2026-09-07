-- Permite marcar um item da comanda como "não enviar pra cozinha" ao incluí-lo —
-- pra quando o item já foi feito/servido e o garçom/estabelecimento só está
-- atualizando o registro da comanda, sem precisar de novo ticket de preparo.
-- Nasce direto em 'sem_preparo' em vez de 'pendente', então fica de fora da fila
-- de envio (processarEnvioPendentes filtra por 'pendente') e do aviso de itens
-- pendentes, sem precisar mexer nesses filtros.
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_status_check;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_status_check
  CHECK (status IN ('pendente','enviado','preparando','pronto','cancelado','sem_preparo'));
