-- "carrossel" deixa de ser uma lista fixa de 4 valores — tags_catalogo é
-- dinâmica (admin cria quantas quiser), então qualquer tag (identificada pelo
-- próprio slug) deve poder virar um carrossel vendável, sem precisar de
-- migration nova a cada tag criada. 'combos' continua sendo o único valor
-- especial (não é uma tag, é o carrossel de combos à parte).
ALTER TABLE public.marketplace_boost_pacotes DROP CONSTRAINT IF EXISTS marketplace_boost_pacotes_carrossel_check;
