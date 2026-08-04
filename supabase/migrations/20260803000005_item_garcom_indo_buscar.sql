-- Garçom clica "Indo buscar" no alerta de prato pronto — não muda o status do item
-- (continua 'pronto'), só liga essa flag pra Cozinha/Bar/Produção mostrarem um banner
-- avisando que o garçom já está a caminho. Reseta quando ele confirma a entrega de
-- verdade (confirmarEntregaItem), igual garcom_nao_entregou.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS garcom_indo_buscar BOOLEAN NOT NULL DEFAULT false;
