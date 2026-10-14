-- Trial sem data de expiração por plano — alternativa a um trial_dias absurdo
-- (já travado em @Max(3650) no DTO depois do bug de produção com
-- trial_dias=9999999 estourando o timestamp do Postgres). Na prática, esse
-- flag só faz PlanosService.atribuirAssinatura conceder automaticamente a
-- mesma cortesia manual (assinaturas.cortesia_ate numa data bem no futuro)
-- que o admin já usa pra "grátis pra sempre" — nenhuma lógica de data nova
-- no caminho de cobrança.
ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS trial_eterno BOOLEAN NOT NULL DEFAULT false;
