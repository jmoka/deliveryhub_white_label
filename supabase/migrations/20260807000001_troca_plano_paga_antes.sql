-- Upgrade/downgrade de plano pelo dono agora exige pagamento do plano novo
-- antes de efetivar a troca. Fatura "de troca" marca o plano alvo aqui —
-- quando confirmada paga (Pix webhook ou cartão na hora), o backend aplica
-- a troca automaticamente. Excluída do cálculo de bloqueio/renovação normal
-- (uma troca abandonada não pode travar o painel nem bloquear "Renovar agora").
ALTER TABLE public.plano_faturas ADD COLUMN plano_id_troca BIGINT REFERENCES public.planos(id);
