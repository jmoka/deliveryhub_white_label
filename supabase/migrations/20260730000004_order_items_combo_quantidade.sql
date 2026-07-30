-- Quantas unidades do combo essa linha representa (mesmo valor em todas as linhas
-- da mesma compra) — sem isso não dá pra saber "2x Super Buyrão" ao reagrupar as
-- linhas explodidas na exibição (combo_nome sozinho não diferencia lotes de compra).
alter table public.order_items
  add column if not exists combo_quantidade integer;
