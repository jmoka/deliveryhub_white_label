-- Vender posição paga nos carrosséis do marketplace (Combos, Mais Vendidos, Em
-- Promoção, Lançamentos) — restaurante compra um pacote (N produtos por X dias)
-- pra aparecer em destaque na home pública, além do que já aparece organicamente.

-- Pacotes vendáveis, definidos pelo admin da plataforma (mesmo espírito de "planos").
CREATE TABLE IF NOT EXISTS public.marketplace_boost_pacotes (
  id            BIGSERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  carrossel     TEXT NOT NULL CHECK (carrossel IN ('combos','mais_vendidos','promocao','lancamentos')),
  qtd_produtos  INT NOT NULL CHECK (qtd_produtos > 0),
  dias          INT NOT NULL CHECK (dias > 0),
  preco         NUMERIC(10,2) NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Campanhas compradas (histórico + ativas). "Ativo" é sempre calculado por data
-- (pago_em IS NOT NULL AND fim_em > now()) — sem job/cron pra virar status.
CREATE TABLE IF NOT EXISTS public.marketplace_boosts (
  id               BIGSERIAL PRIMARY KEY,
  restaurant_id    BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  pacote_id        BIGINT NOT NULL REFERENCES public.marketplace_boost_pacotes(id),
  carrossel        TEXT NOT NULL,              -- denormalizado do pacote, facilita a query de vagas
  item_ids         BIGINT[] NOT NULL,          -- product_id[] (ou combo_id[] quando carrossel='combos')
  valor_centavos   INT NOT NULL,
  reference_id     TEXT,
  pagbank_order_id TEXT,
  pix_code         TEXT,
  pix_qr_url       TEXT,
  pago_em          TIMESTAMPTZ,
  fim_em           TIMESTAMPTZ,                -- calculado na confirmação: pago_em + pacote.dias
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_boosts_ativos
  ON public.marketplace_boosts (carrossel, fim_em) WHERE pago_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_boosts_restaurant
  ON public.marketplace_boosts (restaurant_id);
