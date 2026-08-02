-- Permite reordenar manualmente a fila de "Aguardando Preparo" na tela de Produção.
-- ordem_fila nulo = ordena por enviado_em (comportamento atual); quando setado,
-- tem prioridade sobre enviado_em.
ALTER TABLE order_items ADD COLUMN ordem_fila integer;
