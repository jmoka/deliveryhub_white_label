-- Pagamento em dinheiro: registra quanto o cliente entregou e o troco calculado.
-- Só preenchido quando forma_pagamento = 'cash'.
ALTER TABLE public.comanda_pagamentos
  ADD COLUMN valor_recebido NUMERIC(10,2),
  ADD COLUMN troco NUMERIC(10,2);
