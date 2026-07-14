-- Módulo Salão: observação do garçom por item (ex: "sem cebola", "ponto da carne")
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS observacao TEXT;
