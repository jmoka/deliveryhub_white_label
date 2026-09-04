-- Stripe Connect (Express) — onboarding hospedado, sem o dono da loja digitar
-- credenciais. Coluna dedicada (indexada) para o lookup do webhook por
-- account.id ser rápido e confiável; demais flags de status ficam dentro de
-- payment_config, seguindo o padrão já usado pelo PagBank.
alter table restaurants
  add column if not exists stripe_account_id text;

create unique index if not exists restaurants_stripe_account_id_idx
  on restaurants (stripe_account_id)
  where stripe_account_id is not null;
