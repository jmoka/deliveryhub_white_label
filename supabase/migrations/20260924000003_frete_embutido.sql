-- Frete embutido no preço — lojas de material de peso (areia, cimento, lajota,
-- madeira) já embutem o custo do próprio caminhão no preço exibido. Isso deixa
-- registrado quanto daquele preço é repassado pro frete, só pra bookkeeping da
-- loja — nunca altera o preço cobrado do cliente nem a comissão da plataforma.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS permite_frete_embutido BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS frete_embutido BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frete_embutido_tipo TEXT CHECK (frete_embutido_tipo IN ('percentual', 'fixo')),
  ADD COLUMN IF NOT EXISTS frete_embutido_valor NUMERIC(10,2);

-- Snapshot resolvido no momento da venda (mesmo padrão de unit_price) — preço
-- e percentual do produto podem mudar depois, o valor já vendido não muda.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS frete_embutido_unitario NUMERIC(10,2);
