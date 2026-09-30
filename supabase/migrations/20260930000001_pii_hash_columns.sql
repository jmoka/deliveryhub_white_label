-- Criptografia de PII em repouso (LGPD) — passo 1/2: só adiciona colunas de índice
-- cego (_hash), nullable, sem mexer em constraint nem em dado existente ainda.
-- customers.cpf_cnpj, restaurants.cnpj e motoboys.cnpj vão passar a ser
-- criptografados (AES-256-GCM, EncryptionService) e não dá mais pra comparar
-- direto (.eq/.or) o valor em texto plano — essas colunas guardam
-- HMAC-SHA256(valor normalizado), usado só pra checar igualdade sem decifrar.
-- Populadas pelo script de backfill (scripts/backfill-pii-encryption.ts) antes do
-- código passar a lê-las.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cpf_cnpj_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_cpf_cnpj_hash ON public.customers(cpf_cnpj_hash);

ALTER TABLE public.motoboys ADD COLUMN IF NOT EXISTS cnpj_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_motoboys_cnpj_hash ON public.motoboys(cnpj_hash);

-- Sem UNIQUE ainda de propósito: a troca da constraint de restaurants.cnpj (hoje
-- restaurants_cnpj_unique) pra cnpj_hash só acontece numa segunda migration,
-- depois que o backfill confirmar 100% de cobertura (ver plano).
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS cnpj_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_restaurants_cnpj_hash ON public.restaurants(cnpj_hash);
