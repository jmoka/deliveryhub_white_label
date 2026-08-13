-- Mantém user_profiles.email em sincronia sempre que auth.users.email mudar,
-- seja via auth.admin.updateUserById() (troca pelo admin) ou
-- supabase.auth.updateUser() (autoatendimento, após confirmação). Sem isso,
-- só o caminho do admin ficaria sincronizado (feito manualmente no backend),
-- e a troca por autoatendimento deixaria user_profiles.email desatualizado.
CREATE OR REPLACE FUNCTION public.sync_user_profile_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.user_profiles SET email = NEW.email, updated_at = now() WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_user_profile_email();
