-- Notas de ocorrência do motoboy (entrega pendente / cancelada)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_notes       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_occurrence  TEXT CHECK (delivery_occurrence IN ('pendente', 'cancelada'));
