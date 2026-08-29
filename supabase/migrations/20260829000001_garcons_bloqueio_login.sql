-- Bloqueio temporário de login do garçom após várias senhas erradas seguidas —
-- complementa o rate-limit por IP (@Throttle no login) com um bloqueio por conta,
-- visível com contagem regressiva pro garçom e liberável na hora pelo estabelecimento.
alter table public.garcons
  add column if not exists tentativas_login_falhas integer not null default 0,
  add column if not exists bloqueado_ate timestamptz;
