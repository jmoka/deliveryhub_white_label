-- Função atômica pra decrementar/devolver estoque nas vendas (delivery e salão).
-- UPDATE de uma linha só já é atômico no Postgres, sem precisar de transação explícita.
-- Nunca deixa ir negativo (GREATEST) — evita drift se dois ajustes correrem quase juntos.
create or replace function public.ajustar_estoque(p_product_id bigint, p_delta integer)
returns void
language sql
as $$
  update public.products
  set quantidade_estoque = greatest(quantidade_estoque + p_delta, 0)
  where id = p_product_id;
$$;

grant execute on function public.ajustar_estoque(bigint, integer) to service_role;
