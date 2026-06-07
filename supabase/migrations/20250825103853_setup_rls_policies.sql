-- delivery-base: schema completo + RLS
-- Criado do zero — sem dependência de public."user"

-- =============================================
-- EXTENSÕES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABELAS BASE
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'restaurant_owner', 'customer')),
    phone_e164 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.restaurants (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    logo_url TEXT,
    business_hours JSONB DEFAULT '{}'::jsonb,
    payment_config JSONB DEFAULT '{}'::jsonb,
    comissao_pct NUMERIC(5,2) DEFAULT 5.00,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone_e164 TEXT,
    address_json JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
    restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','ready','out_for_delivery','delivered','canceled')),
    payment_method TEXT DEFAULT 'pix' CHECK (payment_method IN ('pix','credit_card','debit_card','cash')),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de comissões da plataforma
CREATE TABLE IF NOT EXISTS public.plataforma_comissoes (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    pedido_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    valor_venda NUMERIC(10,2) NOT NULL,
    comissao_pct NUMERIC(5,2) NOT NULL,
    comissao_valor NUMERIC(10,2) NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_empresa ON public.plataforma_comissoes(empresa_id);

-- =============================================
-- FUNÇÕES HELPER
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = required_role
  )
$$;

-- Calcula e registra comissão ao marcar pedido como entregue
CREATE OR REPLACE FUNCTION public.registrar_comissao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    pct NUMERIC(5,2);
BEGIN
    IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
        SELECT comissao_pct INTO pct FROM public.restaurants WHERE id = NEW.restaurant_id;
        INSERT INTO public.plataforma_comissoes (empresa_id, pedido_id, valor_venda, comissao_pct, comissao_valor)
        VALUES (NEW.restaurant_id, NEW.id, NEW.total, pct, ROUND(NEW.total * pct / 100, 2));
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_order_delivered ON public.orders;
CREATE TRIGGER on_order_delivered
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.registrar_comissao();

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plataforma_comissoes ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "perfil_proprio" ON public.user_profiles
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admin_ver_perfis" ON public.user_profiles
    FOR SELECT TO authenticated USING (public.is_admin());

-- restaurants
CREATE POLICY "publico_ver_restaurantes" ON public.restaurants
    FOR SELECT TO public USING (true);
CREATE POLICY "admin_gerir_restaurantes" ON public.restaurants
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "dono_gerir_proprio" ON public.restaurants
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- categories
CREATE POLICY "publico_ver_categorias" ON public.categories
    FOR SELECT TO public USING (true);
CREATE POLICY "admin_gerir_categorias" ON public.categories
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- products
CREATE POLICY "publico_ver_produtos" ON public.products
    FOR SELECT TO public USING (true);
CREATE POLICY "admin_gerir_produtos" ON public.products
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- customers
CREATE POLICY "cliente_proprio" ON public.customers
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_gerir_clientes" ON public.customers
    FOR ALL TO authenticated USING (public.is_admin());

-- orders
CREATE POLICY "pedido_proprio" ON public.orders
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_gerir_pedidos" ON public.orders
    FOR ALL TO authenticated USING (public.is_admin());

-- order_items
CREATE POLICY "itens_pedido_proprio" ON public.order_items
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "admin_gerir_itens" ON public.order_items
    FOR ALL TO authenticated USING (public.is_admin());

-- plataforma_comissoes (só admin lê)
CREATE POLICY "admin_ver_comissoes" ON public.plataforma_comissoes
    FOR ALL TO authenticated USING (public.is_admin());

-- =============================================
-- DADOS DE TESTE
-- =============================================
DO $$
DECLARE
    r_id BIGINT;
    c_id BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.restaurants LIMIT 1) THEN
        INSERT INTO public.restaurants (name, address, comissao_pct)
        VALUES ('Restaurante Demo', 'Rua Exemplo, 123 - São Paulo/SP', 5.00)
        RETURNING id INTO r_id;

        INSERT INTO public.categories (name, restaurant_id)
        VALUES ('Lanches', r_id);

        INSERT INTO public.categories (name, restaurant_id)
        VALUES ('Bebidas', r_id);

        SELECT id INTO c_id FROM public.categories WHERE restaurant_id = r_id LIMIT 1;

        INSERT INTO public.products (name, description, price, category_id)
        VALUES ('X-Burguer', 'Hambúrguer artesanal com queijo', 25.90, c_id);

        INSERT INTO public.products (name, description, price, category_id)
        VALUES ('Batata Frita', 'Porção individual crocante', 12.00, c_id);

        RAISE NOTICE 'Dados de teste criados: restaurante_id=%', r_id;
    END IF;
END $$;
