-- Parte do frete_repassado que veio do excedente de distância (não do frete fixo) —
-- guarda separado só pra poder mostrar detalhado no painel financeiro do motoboy.
ALTER TABLE public.motoboy_comissoes
  ADD COLUMN IF NOT EXISTS frete_excedente_repassado NUMERIC(10,2) NOT NULL DEFAULT 0;
