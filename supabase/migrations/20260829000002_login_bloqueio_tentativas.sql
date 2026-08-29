-- Bloqueio temporário de login (conta principal: cliente/dono/admin) após várias
-- senhas erradas seguidas — mesmo padrão já aplicado ao garçom (ver
-- 20260829000001_garcons_bloqueio_login.sql), agora pra quem entra via Supabase Auth.
alter table public.user_profiles
  add column if not exists tentativas_login_falhas integer not null default 0,
  add column if not exists bloqueado_login_ate timestamptz;
