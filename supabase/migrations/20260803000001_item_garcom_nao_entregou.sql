-- Garçom marca "Não entreguei" num item pronto: volta status pra 'enviado' (fila de
-- preparo) e liga essa flag pra Cozinha/Bar/Produção destacarem o item (borda vermelha +
-- aviso fixo). Fica ligada durante todo o reprocessamento (preparando->pronto de novo) e
-- só desliga quando o garçom confirma a entrega de fato (confirmarEntregaItem).
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS garcom_nao_entregou BOOLEAN NOT NULL DEFAULT false;
