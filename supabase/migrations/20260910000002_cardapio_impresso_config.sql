-- Configuração do cardápio impresso (rodapé, logo, imagem de fundo, ordem de
-- categorias/grupos, tamanhos de fonte) vivia só em localStorage do navegador
-- do dono — trocar de computador/navegador ou limpar dados perdia tudo.
-- Passa a ser persistida no banco, mesmo padrão já usado por `aparencia`/
-- `payment_config` (blob JSONB com whitelist de campos no service).
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS cardapio_impresso_config JSONB NOT NULL DEFAULT '{}';
