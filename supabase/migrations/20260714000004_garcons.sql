-- Módulo Salão: garçons (staff do restaurante, login próprio via key+senha, criado só pelo dono)
CREATE TABLE IF NOT EXISTS public.garcons (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  telefone       TEXT,
  login_key      TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  permissoes     JSONB NOT NULL DEFAULT '{"desconto":false,"cancelar":false,"acrescimo":false}'::jsonb,
  ultimo_acesso_em TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_garcons_restaurant ON public.garcons (restaurant_id);

ALTER TABLE public.garcons ENABLE ROW LEVEL SECURITY;

CREATE POLICY garcons_owner ON public.garcons
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );
