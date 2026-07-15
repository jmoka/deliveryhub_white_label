-- Estabelecimento pode bloquear uma mesa (reserva, manutenção...) sem precisar abrir
-- comanda nela — mesa livre não fica disponível pro garçom até ser desbloqueada.
ALTER TABLE public.mesas DROP CONSTRAINT IF EXISTS mesas_status_check;
ALTER TABLE public.mesas ADD CONSTRAINT mesas_status_check
  CHECK (status IN ('livre','ocupada','aguardando_pagamento','bloqueada'));
