-- Motivo quando o admin recusa a solicitação de domínio — dono vê o porquê e pode
-- corrigir e reenviar.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_domain_motivo_recusa TEXT;
