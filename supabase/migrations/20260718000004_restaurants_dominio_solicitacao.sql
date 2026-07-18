-- Solicitação do dono pro admin configurar o domínio customizado no EasyPanel.
-- custom_domain_status: null (sem solicitação) | 'pendente' (aguardando admin).
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_domain_status TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_solicitado_em TIMESTAMPTZ;
