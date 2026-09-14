-- Cortesia (plano "gratis" ate uma data) e plano exclusivo pra novos cadastros.

-- Ate essa data, a mensalidade do plano vira isenta na geracao de fatura
-- (sincronizarPeriodo, mesmo mecanismo ja usado pra isencao por piso de
-- faturamento) -- nao existe flag booleano de "gratis": clicar em "Gratis" no
-- admin so preenche esse campo com uma data bem no futuro (ex: +50 anos).
-- Comissao (cobra_comissao) continua sendo cobrada por fora, mesma regra ja
-- aplicada a isencao por piso_faturamento.
ALTER TABLE public.assinaturas ADD COLUMN cortesia_ate TIMESTAMPTZ;

-- Plano visivel so no cadastro de restaurante novo (onboarding) -- some da
-- tela de troca/upgrade de plano de quem ja e cliente.
ALTER TABLE public.planos ADD COLUMN somente_novos_cadastros BOOLEAN NOT NULL DEFAULT false;
