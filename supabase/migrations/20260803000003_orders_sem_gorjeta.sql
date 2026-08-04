-- Cliente do auto atendimento pode optar por não pagar a gorjeta do garçom antes do
-- fechamento — precisa ficar persistido pra o garçom/caixa respeitar na hora de fechar
-- (o checkbox que já existia no ComandaModal do dono era só estado local, nunca salvava).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sem_gorjeta BOOLEAN NOT NULL DEFAULT false;
