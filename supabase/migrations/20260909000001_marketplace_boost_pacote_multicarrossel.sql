-- Pacote deixa de ser "1 carrossel + 1 quantidade" e passa a ter uma
-- composição por carrossel (config jsonb, carrossel -> quantidade), no mesmo
-- formato já usado em marketplace_boost_vagas_presets. Isso permite que um
-- pacote único dê direito a vários carrosséis ao mesmo tempo (ex: 1 item nos
-- Combos + 3 em Bebidas), com a quantidade de cada um vindo direto do perfil
-- de vagas escolhido — em vez de criar um pacote redundante por carrossel,
-- todos com a mesma quantidade digitada à mão (comportamento antigo).

ALTER TABLE public.marketplace_boost_pacotes ADD COLUMN IF NOT EXISTS config JSONB;

UPDATE public.marketplace_boost_pacotes
  SET config = jsonb_build_object(carrossel, qtd_produtos)
  WHERE config IS NULL;

ALTER TABLE public.marketplace_boost_pacotes ALTER COLUMN config SET NOT NULL;
ALTER TABLE public.marketplace_boost_pacotes DROP COLUMN carrossel;
ALTER TABLE public.marketplace_boost_pacotes DROP COLUMN qtd_produtos;

-- Campanha comprada (marketplace_boosts) espelha a mesma mudança: os itens
-- escolhidos passam a ser um mapa por carrossel (itens), não uma lista única
-- presa a um "carrossel" só.
ALTER TABLE public.marketplace_boosts ADD COLUMN IF NOT EXISTS itens JSONB;

UPDATE public.marketplace_boosts
  SET itens = jsonb_build_object(carrossel, to_jsonb(item_ids))
  WHERE itens IS NULL;

ALTER TABLE public.marketplace_boosts ALTER COLUMN itens SET NOT NULL;

DROP INDEX IF EXISTS idx_marketplace_boosts_ativos;
ALTER TABLE public.marketplace_boosts DROP COLUMN carrossel;
ALTER TABLE public.marketplace_boosts DROP COLUMN item_ids;

CREATE INDEX IF NOT EXISTS idx_marketplace_boosts_ativos
  ON public.marketplace_boosts (fim_em) WHERE pago_em IS NOT NULL;
