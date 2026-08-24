-- Toggle explícito: restaurante usa API do PagBank (padrão) ou recebe pagamento
-- manualmente (cliente só informa a forma de pagamento no checkout, motoboy cobra
-- na entrega). Coluna própria (fora de payment_config) porque o checkout público
-- do cliente precisa ler esse valor sem autenticação de dono.

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS pagamento_manual BOOLEAN NOT NULL DEFAULT false;
