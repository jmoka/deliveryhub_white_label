-- Catálogo do GDOOR local (ESTOQUE), espelhado pelo agente a cada poll — só
-- alimenta o seletor de código no painel, o GDOOR local continua sendo a fonte
-- de verdade (o agente nunca decide sozinho um mapeamento).
CREATE TABLE IF NOT EXISTS public.gdoor_estoque_cache (
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  codigo        TEXT NOT NULL,
  descricao     TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (restaurant_id, codigo)
);

-- Mapeamento produto DeliveryHub -> código GDOOR, escolhido pelo dono no painel.
-- Resolvido no momento de criar o job (gdoor.service.ts) e gravado direto no
-- payload, pra o agente não precisar de mapeamento local pra gravar a pré-venda.
CREATE TABLE IF NOT EXISTS public.gdoor_produto_mapeamento (
  restaurant_id   BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  product_id      BIGINT NOT NULL,
  codigo_gdoor    TEXT NOT NULL,
  descricao_gdoor TEXT,
  atualizado_em   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (restaurant_id, product_id)
);
