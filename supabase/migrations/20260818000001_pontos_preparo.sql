-- Ponto de preparo: qualquer impressora marcada aqui ganha automaticamente uma
-- tela dedicada no painel (mesmo padrão de Cozinha/Bar) + entrada no menu lateral,
-- sem precisar codar uma página nova pra cada nome novo (Churrasqueira, Drinks
-- etc). Cozinha e Bar continuam como páginas fixas próprias, independentes disso.
ALTER TABLE public.impressoras
  ADD COLUMN IF NOT EXISTS ponto_preparo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icone TEXT NOT NULL DEFAULT 'ChefHat';
