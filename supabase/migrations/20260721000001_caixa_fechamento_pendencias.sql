-- Permite fechar o caixa mesmo com pedidos/comandas/mesas em aberto (fiado/pendente)
ALTER TABLE public.caixas
  ADD COLUMN fechado_com_pendencias BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pendencias_fechamento JSONB;
