-- Opcional — só obrigatório fiscalmente pra NFe, não pra NFC-e (que é o modelo
-- usado na integração GDOOR, via pré-venda). Sem validação de dígito verificador
-- por enquanto, só o texto que o cliente digitar.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
