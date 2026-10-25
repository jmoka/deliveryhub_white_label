-- Achado de auditoria (2026-08-15, reconfirmado 2026-10-25): policy
-- "publico_ver_restaurantes" (SELECT, role public, USING true) expunha a
-- LINHA INTEIRA de todo restaurante via REST com a anon key, incluindo cnpj,
-- payment_config, saldo_caixa, stripe_account_id, cozinha_token,
-- agente_impressao_token, gdoor_agente_token (tokens de portal/impressora).
--
-- Confirmado via grep que nenhum frontend consulta public.restaurants direto
-- (sempre via backend NestJS, que usa service_role e ignora RLS) — a vitrine
-- pública da loja (/r/:slug etc.) já passa pelo backend, então essa policy
-- nunca foi necessária para a funcionalidade atual. "dono_gerir_proprio"
-- (próprio dono) e "admin_gerir_restaurantes" (admin) continuam intactas.
DROP POLICY IF EXISTS "publico_ver_restaurantes" ON public.restaurants;

-- Achado adjacente (mesma auditoria): bucket comprovantes-pix (comprovante de
-- PIX de pedido/fatura anexado por cliente/dono) estava público — qualquer um
-- com a URL (ou adivinhando o path previsível pedido-<id>-<ts>.ext) acessava
-- sem autenticação. motoboy-documentos já era privado; agora comprovantes-pix
-- segue o mesmo padrão. Leitura passa a exigir signed URL (ver SupabaseService
-- + pedidos.service.ts/planos.service.ts/motoboy.service.ts).
UPDATE storage.buckets SET public = false WHERE id = 'comprovantes-pix';
