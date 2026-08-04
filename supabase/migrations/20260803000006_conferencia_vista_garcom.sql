-- Garçom clica "OK, entendi" no alerta de conferência — precisa sumir da tela DELE
-- (badge na mesa e em "Minhas comandas"), mas o caixa/balcão continua vendo até
-- imprimir de verdade (conferencia_solicitada_em só é limpo lá, fluxo já existente).
-- Campo separado pra não interferir nesse fluxo do caixa.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS conferencia_vista_garcom_em TIMESTAMPTZ;
