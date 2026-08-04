-- Garçom responsável pela mesa recebe alerta quando o cliente faz um pedido pelo
-- auto atendimento (igual já recebe quando o prato fica pronto) — timestamp muda a
-- cada "Solicitar pedido" do cliente, front compara com o último valor visto por comanda.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ultimo_pedido_cliente_em TIMESTAMPTZ;
