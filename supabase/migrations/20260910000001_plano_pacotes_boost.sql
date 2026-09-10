-- Plano de assinatura pode incluir pacotes de destaque do marketplace boost
-- como benefício (ex: "Plano Pro" já vem com a campanha "3 produtos/15 dias"
-- de graça) — join table simples, sem coluna extra em nenhuma das duas
-- tabelas. Restaurante assinante de um plano com o pacote incluso usa esse
-- pacote sem pagar (ver MarketplaceBoostService.pacoteInclusoNoPlano).

CREATE TABLE IF NOT EXISTS public.plano_pacotes_boost (
  plano_id   BIGINT NOT NULL REFERENCES public.planos(id) ON DELETE CASCADE,
  pacote_id  BIGINT NOT NULL REFERENCES public.marketplace_boost_pacotes(id) ON DELETE CASCADE,
  PRIMARY KEY (plano_id, pacote_id)
);

CREATE INDEX IF NOT EXISTS idx_plano_pacotes_boost_pacote ON public.plano_pacotes_boost (pacote_id);
