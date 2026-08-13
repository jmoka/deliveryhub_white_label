-- Formaliza no schema a regra "1 restaurante por dono" que o código já
-- pressupõe (RestaurantOwnerGuard usa .maybeSingle(), que quebra se 2+
-- restaurantes tiverem o mesmo user_id). UNIQUE permite múltiplos NULL
-- (restaurante sem dono ainda), então não afeta cadastros em andamento.
--
-- Antes de aplicar em produção, rodar:
--   SELECT user_id, COUNT(*) FROM public.restaurants
--   WHERE user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*) > 1;
-- e resolver manualmente qualquer duplicata encontrada.
ALTER TABLE public.restaurants
    ADD CONSTRAINT restaurants_user_id_unique UNIQUE (user_id);
