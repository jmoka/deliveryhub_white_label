-- Link público de pagamento por fatura — admin gera e envia pro cliente pagar
-- sem precisar de login (ex.: WhatsApp). Token opaco, não é o id sequencial da
-- fatura, pra não virar IDOR enumerável (GET público em fatura-pagamento/:token).

ALTER TABLE public.plano_faturas
  ADD COLUMN IF NOT EXISTS link_pagamento_token TEXT UNIQUE;
