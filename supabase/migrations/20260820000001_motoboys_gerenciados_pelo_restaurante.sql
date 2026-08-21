-- Estabelecimento passa a poder cadastrar seus próprios motoboys diretamente
-- (sem passar pelo autocadastro + aprovação da plataforma + solicitação de
-- afiliação) e bloquear/editar/excluir quem ele mesmo cadastrou. Não altera
-- o fluxo existente de autocadastro/afiliação — só adiciona essa possibilidade.

ALTER TABLE public.motoboys
  ADD COLUMN IF NOT EXISTS criado_por_restaurant_id BIGINT REFERENCES public.restaurants(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.motoboys.criado_por_restaurant_id IS
  'Preenchido quando o motoboy foi cadastrado diretamente pelo estabelecimento (não autocadastro). Só esse restaurante pode editar/excluir o cadastro.';

CREATE INDEX IF NOT EXISTS idx_motoboys_criado_por_restaurant ON public.motoboys (criado_por_restaurant_id);

-- Bloqueio por estabelecimento: pausa o motoboy pra esse restaurante específico
-- (não pega/recebe mais pedidos daqui) sem desfazer a afiliação — diferente de
-- "removido", que exige nova solicitação pra voltar a atender.
ALTER TABLE public.motoboy_estabelecimentos
  ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN NOT NULL DEFAULT false;
