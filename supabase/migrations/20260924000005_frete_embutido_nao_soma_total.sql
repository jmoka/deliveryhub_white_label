-- Frete embutido é bookkeeping/repasse pro motoboy (frete_cobrado/frete_excedente_cobrado
-- continuam alimentando ComissaoService e o app do motoboy) — mas o valor já está dentro
-- do preço do produto, então NUNCA deve somar no total cobrado do cliente (senão cobra o
-- frete duas vezes: uma embutida no preço, outra somada no checkout). Esse flag marca,
-- por pedido, se frete_cobrado/frete_excedente_cobrado são "repasse invisível" (peso) em
-- vez de "cobrança real" (regra normal) — front usa pra mostrar os dois valores riscados
-- com "Grátis" em vez de somar no Total.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_embutido_no_pedido boolean NOT NULL DEFAULT false;
