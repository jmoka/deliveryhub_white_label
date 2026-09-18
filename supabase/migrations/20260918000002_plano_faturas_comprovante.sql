-- Anexo de comprovante em fatura de plano/pacote paga via Pix manual —
-- mesmo padrão já usado em orders.comprovante_pagamento_url/comprovante_pulado
-- (checkout do cliente final), agora pro dono confirmar pagamento de fatura
-- quando a plataforma está em modo de recebimento manual.

ALTER TABLE public.plano_faturas
  ADD COLUMN IF NOT EXISTS comprovante_pagamento_url TEXT,
  ADD COLUMN IF NOT EXISTS comprovante_pulado BOOLEAN NOT NULL DEFAULT false;
