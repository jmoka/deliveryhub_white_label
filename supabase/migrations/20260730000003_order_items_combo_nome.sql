-- Combo vira linhas dos produtos reais (ver CombosService), mas guarda o nome do combo
-- de origem só pra exibição — senão o cliente/garçom/dono não sabe que "Batata Frita +
-- Cerveja" na lista vieram juntos de um combo.
alter table public.order_items
  add column if not exists combo_nome text;
