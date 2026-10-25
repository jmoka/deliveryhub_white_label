-- Achado de auditoria (2026-08-15, reconfirmado 2026-10-14/25): 17 tabelas sem
-- RLS, expostas por completo a anon/authenticated via REST. Nenhum frontend
-- consulta essas tabelas direto (sempre via backend com service_role, que
-- ignora RLS) — confirmado via grep antes de escrever esta migration.
-- Padrão replicado das tabelas já protegidas (products/orders/motoboys):
-- admin_gerir_* (ALL, authenticated, is_admin()) em todas; owner_ver_* (SELECT,
-- restaurant_id do dono) nas que têm restaurant_id. Tabelas sem restaurant_id
-- (instalacoes_locais, marketplace_boost_pacotes, plano_pacotes_boost, planos,
-- platform_settings) ficam admin-only.

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_observacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdoor_cliente_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdoor_cliente_mapeamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdoor_criar_cliente_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdoor_criar_produto_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdoor_estoque_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdoor_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdoor_produto_mapeamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacoes_locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_boost_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoboy_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_pacotes_boost ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- admin: acesso total em todas as 17
CREATE POLICY "admin_gerir_assinaturas" ON public.assinaturas FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_category_observacoes" ON public.category_observacoes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_gdoor_cliente_cache" ON public.gdoor_cliente_cache FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_gdoor_cliente_mapeamento" ON public.gdoor_cliente_mapeamento FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_gdoor_criar_cliente_jobs" ON public.gdoor_criar_cliente_jobs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_gdoor_criar_produto_jobs" ON public.gdoor_criar_produto_jobs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_gdoor_estoque_cache" ON public.gdoor_estoque_cache FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_gdoor_jobs" ON public.gdoor_jobs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_gdoor_produto_mapeamento" ON public.gdoor_produto_mapeamento FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_instalacoes_locais" ON public.instalacoes_locais FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_marketplace_boost_pacotes" ON public.marketplace_boost_pacotes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_marketplace_boosts" ON public.marketplace_boosts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_motoboy_comissoes" ON public.motoboy_comissoes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_plano_faturas" ON public.plano_faturas FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_plano_pacotes_boost" ON public.plano_pacotes_boost FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_planos" ON public.planos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_gerir_platform_settings" ON public.platform_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- dono: leitura do próprio restaurante, só nas tabelas com restaurant_id
CREATE POLICY "owner_ver_assinaturas" ON public.assinaturas FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_gerir_category_observacoes" ON public.category_observacoes FOR ALL TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()))
  WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_gdoor_cliente_cache" ON public.gdoor_cliente_cache FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_gdoor_cliente_mapeamento" ON public.gdoor_cliente_mapeamento FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_gdoor_criar_cliente_jobs" ON public.gdoor_criar_cliente_jobs FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_gdoor_criar_produto_jobs" ON public.gdoor_criar_produto_jobs FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_gdoor_estoque_cache" ON public.gdoor_estoque_cache FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_gdoor_jobs" ON public.gdoor_jobs FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_gdoor_produto_mapeamento" ON public.gdoor_produto_mapeamento FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_marketplace_boosts" ON public.marketplace_boosts FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_motoboy_comissoes" ON public.motoboy_comissoes FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_ver_plano_faturas" ON public.plano_faturas FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));
