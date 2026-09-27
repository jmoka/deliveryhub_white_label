-- E-mail de segurança: endereço alternativo, verificado por código, usado como
-- destino de recuperação de senha e 2FA por e-mail — resolve o caso de conta
-- de login com e-mail fake/inexistente (cliente cadastra qualquer coisa só
-- pra passar do cadastro) que nunca vai receber nada no e-mail de login.
-- Verificado = email_seguranca_verificado_em não nulo (sem coluna boolean
-- redundante); qualquer novo POST /solicitar zera esse campo até confirmar.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email_seguranca TEXT,
  ADD COLUMN IF NOT EXISTS email_seguranca_verificado_em TIMESTAMPTZ;
