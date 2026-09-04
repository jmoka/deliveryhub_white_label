-- Cliente pede orçamento de um serviço na vitrine pública, sem login — é só
-- repasse de contato pro estabelecimento ligar por fora do app (sem chat nem
-- pagamento dentro do app nesse fluxo).

CREATE TABLE IF NOT EXISTS public.solicitacoes_orcamento_servico (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  -- Redundante com service_id.restaurant_id de propósito (evita join extra em
  -- toda listagem/contagem do painel) — mesmo padrão de motoboy_repasse_solicitacoes.
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT NOT NULL,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'contatado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  contatado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solic_orcamento_restaurant_status ON public.solicitacoes_orcamento_servico(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_solic_orcamento_service ON public.solicitacoes_orcamento_servico(service_id);

ALTER TABLE public.solicitacoes_orcamento_servico ENABLE ROW LEVEL SECURITY;

-- RLS habilitada, sem policy — o INSERT público vem de um endpoint dedicado no
-- backend (service role), nunca do client Supabase direto no browser (evita
-- spam/abuso via chave anon exposta) — mesmo padrão de motoboy_repasse_solicitacoes.
