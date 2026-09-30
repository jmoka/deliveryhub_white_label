-- Criptografia de PII em repouso — passo 2/2. Só aplicar DEPOIS de rodar
-- `npm run backfill:pii-encryption` (server_delivery) no ambiente alvo e
-- confirmar que restaurants.cnpj_hash está populado pra toda linha com cnpj
-- não nulo — a UNIQUE abaixo falha se houver linha não preenchida ainda.
--
-- restaurants.cnpj virou ciphertext (AES-256-GCM, IV aleatório) — a UNIQUE
-- antiga em cima da coluna em claro não pega mais duplicata nenhuma (dois
-- CNPJs iguais criptografados nunca dão o mesmo ciphertext). A dedupe real
-- agora é feita pela aplicação via cnpj_hash (índice cego determinístico,
-- ver OnboardingController.checarDuplicados) — essa migration só torna isso
-- também garantido no nível do banco.

ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_cnpj_unique;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_cnpj_hash_unique UNIQUE (cnpj_hash);
