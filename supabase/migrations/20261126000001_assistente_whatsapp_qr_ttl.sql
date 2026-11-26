-- QR do WhatsApp (Evolution) tem janela de validade curta — sem essa coluna não
-- dá pra saber, do lado do backend, se a instância "aguardando_qr" travada é
-- porque o QR ainda tá de pé ou porque expirou e ninguém limpou. TTL aplicado em
-- assistente.service.ts (QR_TTL_MS), não aqui — coluna só guarda o carimbo.
ALTER TABLE public.assistentes_estabelecimento
  ADD COLUMN IF NOT EXISTS whatsapp_qr_gerado_em TIMESTAMPTZ;
