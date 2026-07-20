-- Quando o caixa/estabelecimento abre mesa/comanda direto (sem garçom), guarda o
-- primeiro nome de quem estava logado, pro card da mesa mostrar "Caixa: nome".
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS aberto_por_nome text;
