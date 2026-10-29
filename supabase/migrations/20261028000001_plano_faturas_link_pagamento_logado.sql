-- Segundo tipo de link de pagamento de fatura: igual ao link_pagamento_token,
-- mas a página pública exige login do dono do restaurante antes de mostrar o
-- QR/Pix (RestauranteGuard) — pra admin mandar via WhatsApp com mais garantia
-- de identidade do que o link totalmente sem login.

ALTER TABLE public.plano_faturas
  ADD COLUMN IF NOT EXISTS link_pagamento_logado_token TEXT UNIQUE;
