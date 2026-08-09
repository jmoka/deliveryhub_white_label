-- Pagamento em dinheiro cujo troco foi devolvido via Pix (não sai do caixa físico) em
-- vez de espécie — usado quando o caixa não tem troco físico disponível ou o
-- estabelecimento prefere não desfalcar a espécie.
ALTER TABLE public.comanda_pagamentos
  ADD COLUMN troco_via_pix BOOLEAN NOT NULL DEFAULT false;
