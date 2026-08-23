-- Sessão de trabalho do garçom (turno): abre automaticamente na primeira comanda do
-- garçom, encerra quando ele faz "Sair" no portal, com snapshot congelado dos valores
-- (mesmo padrão de caixas.resumo) e aceite/discordância do próprio garçom sobre os
-- valores apurados (vendas, gorjeta, comissão) daquele intervalo.
CREATE TABLE public.garcom_turnos (
  id                    BIGSERIAL PRIMARY KEY,
  restaurant_id         BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  garcom_id             BIGINT NOT NULL REFERENCES public.garcons(id) ON DELETE CASCADE,
  aberto_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechado_em            TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  resumo                JSONB,
  conferido_pelo_garcom BOOLEAN,
  observacao_garcom     TEXT
);

CREATE INDEX idx_garcom_turnos_garcom ON public.garcom_turnos (garcom_id);
CREATE INDEX idx_garcom_turnos_restaurant ON public.garcom_turnos (restaurant_id);
CREATE INDEX idx_garcom_turnos_fechado_em ON public.garcom_turnos (fechado_em);

-- Só um turno aberto por garçom por vez.
CREATE UNIQUE INDEX idx_garcom_turnos_um_aberto ON public.garcom_turnos (garcom_id) WHERE status = 'aberto';

ALTER TABLE public.garcom_turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY garcom_turnos_owner ON public.garcom_turnos
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );
