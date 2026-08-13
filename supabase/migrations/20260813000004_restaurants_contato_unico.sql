-- Impede dois estabelecimentos com o mesmo CNPJ, WhatsApp ou email no
-- cadastro. Guardados normalizados (cnpj/whatsapp só dígitos, email em
-- minúsculas) — a comparação de unicidade é sempre feita nesse formato pelo
-- backend, então a constraint aqui reflete exatamente o que é gravado.
-- CNPJ é opcional na wizard: UNIQUE do Postgres permite múltiplos NULL, então
-- não bloqueia quem deixa em branco.
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS cnpj TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.restaurants
    ADD CONSTRAINT restaurants_cnpj_unique UNIQUE (cnpj);

ALTER TABLE public.restaurants
    ADD CONSTRAINT restaurants_whatsapp_unique UNIQUE (whatsapp);

ALTER TABLE public.restaurants
    ADD CONSTRAINT restaurants_email_unique UNIQUE (email);
