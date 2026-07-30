-- Preço que o dono decide cobrar por ESSE produto especificamente dentro do combo
-- (desconto por item, não mais um fator único aplicado igual em tudo). Preço (R$) e
-- Preço promo (R$) do combo passam a ser calculados a partir da soma desses valores
-- + preço real de tabela, não digitados direto pelo dono.
alter table public.combo_items
  add column if not exists preco_no_combo numeric(10,2);
