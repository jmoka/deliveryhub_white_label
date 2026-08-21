-- Migração do motoboy pra Supabase Auth de verdade (login por password_hash/JWT
-- próprio vira legado). motoboys.user_id já existia (20260714000002) mas nada
-- garantia unicidade — o novo guard depende de um lookup único por user_id.
CREATE UNIQUE INDEX IF NOT EXISTS motoboys_user_id_unique
  ON public.motoboys (user_id) WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.motoboys.password_hash IS
  'Legado — pré-migração pra Supabase Auth. Não lido/escrito em novos fluxos.';
COMMENT ON COLUMN public.motoboys.access_token IS
  'Legado — token estático de link de cadastro pré-senha. Não lido/escrito em novos fluxos.';

-- Estende o trigger que já sincroniza user_profiles.email quando auth.users.email
-- muda (20260813000003) pra também manter motoboys.email em dia, já que e-mail
-- passa a ser a identidade de login do motoboy.
CREATE OR REPLACE FUNCTION public.sync_user_profile_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.user_profiles SET email = NEW.email, updated_at = now() WHERE id = NEW.id;
    UPDATE public.motoboys SET email = NEW.email WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$;

-- Nota: a política RLS `motoboys_owner` (20260607000003) ainda referencia a coluna
-- legada `restaurant_id`, não `criado_por_restaurant_id`/`motoboy_estabelecimentos`.
-- Na prática é código morto: SupabaseService sempre usa a service-role key (ignora
-- RLS) e nenhum código do frontend consulta `motoboys` com a anon key. Deixado como
-- está de propósito — fora do escopo desta migração, cabe uma limpeza à parte.
