-- Sessão única por garçom/motoboy: bloqueia login em segundo dispositivo enquanto
-- a sessão anterior não expirar (TTL do JWT) ou o estabelecimento forçar logout.
alter table public.garcons
  add column if not exists active_session_id text,
  add column if not exists session_expires_at timestamptz;

alter table public.motoboys
  add column if not exists active_session_id text,
  add column if not exists session_expires_at timestamptz;
