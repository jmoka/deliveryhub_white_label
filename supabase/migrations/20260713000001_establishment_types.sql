-- Tipos de estabelecimento (restaurante, farmácia, mat. construção etc).
-- Populada pelo dev via migration — sem CRUD de admin nessa fase.
CREATE TABLE IF NOT EXISTS public.establishment_types (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    icon_name  TEXT NOT NULL DEFAULT 'Store',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.establishment_types (name, icon_name)
VALUES
    ('Restaurante',          'UtensilsCrossed'),
    ('Farmácia',             'Pill'),
    ('Material de Construção', 'HardHat')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.establishment_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'establishment_types'
          AND policyname = 'establishment_types_public_read'
    ) THEN
        EXECUTE 'CREATE POLICY "establishment_types_public_read" ON public.establishment_types FOR SELECT USING (true)';
    END IF;
END $$;

-- Vincula cada restaurante a um tipo. Default = "Restaurante", pra não quebrar cadastros existentes.
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS type_id BIGINT REFERENCES public.establishment_types(id);

UPDATE public.restaurants
SET type_id = (SELECT id FROM public.establishment_types WHERE name = 'Restaurante')
WHERE type_id IS NULL;
