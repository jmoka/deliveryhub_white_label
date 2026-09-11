-- Favoritos da barra superior (restaurante e admin) viviam só em localStorage
-- do navegador (favoritos_restaurante_<userId>/favoritos_admin_<userId>) —
-- trocar de dispositivo/navegador ou limpar dados perdia a seleção.
-- Passa a ser persistido no banco, por usuário, mesmo padrão já usado por
-- `cardapio_impresso_config`/`aparencia` (blob JSONB com whitelist no service).
-- Formato: {"restaurante": {"paths": [...], "mostrar_nomes": true}, "admin": {...}}
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS favoritos_menu JSONB NOT NULL DEFAULT '{}';
