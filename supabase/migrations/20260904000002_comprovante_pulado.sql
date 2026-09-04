-- Cliente optou por não anexar comprovante do PIX manual agora e vai
-- mostrar/pagar em pessoa (motoboy na entrega, ou no balcão em retirada) —
-- distingue "cliente escolheu pular" de "cliente ainda não anexou" (silêncio)
-- na tela de pagamento do dono.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS comprovante_pulado BOOLEAN NOT NULL DEFAULT false;
