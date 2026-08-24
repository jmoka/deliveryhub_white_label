-- Comprovante fotográfico na entrega agora cobre PIX e cartão (maquininha), não só PIX.

ALTER TABLE public.orders RENAME COLUMN comprovante_pix_url TO comprovante_pagamento_url;
