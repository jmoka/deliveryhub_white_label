-- Garçom confirma que levou o item até a mesa depois do Bar/Cozinha marcar 'pronto'.
-- Coluna própria (não mexe no enum/CHECK de status, que é compartilhado com delivery) —
-- delivery nunca grava nada aqui, continua exatamente como está.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS entregue_garcom BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMPTZ;
