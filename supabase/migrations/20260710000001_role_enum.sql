-- Converte user_profiles.role de TEXT + CHECK para ENUM nativo do Postgres.
-- CHECK constraint permitia qualquer TEXT validado só na escrita; ENUM garante
-- o tipo no schema (autocomplete no Studio, validação mais cedo).
-- 'motoboy' incluido porque 20260607000003_motoboys.sql ja liberou esse valor
-- via user_profiles_role_check.
CREATE TYPE public.user_role AS ENUM ('admin', 'restaurant_owner', 'customer', 'motoboy');

-- Precisa cair antes do ALTER COLUMN TYPE: o CHECK guarda os literais como TEXT,
-- e a revalidação dele durante o ALTER TYPE tentaria comparar user_role = text.
ALTER TABLE public.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
    ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.user_profiles
    ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

ALTER TABLE public.user_profiles
    ALTER COLUMN role SET DEFAULT 'customer'::public.user_role;

-- has_role() recebe TEXT (chamado de fora) — precisa cast explicito pro enum
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = required_role::public.user_role
  )
$$;

-- handle_new_user() insere role vindo de user_metadata (TEXT) — cast explicito
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
