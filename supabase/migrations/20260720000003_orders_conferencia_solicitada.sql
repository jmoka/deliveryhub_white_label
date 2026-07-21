-- Cliente (tela mesa-acompanhar, sem login) só pode SOLICITAR conferência, nunca
-- mandar pra impressão direto. Fica marcado até o caixa atender (ver
-- imprimirConferencia no PDV, que limpa esse campo ao gerar a conferência real).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS conferencia_solicitada_em timestamptz;
