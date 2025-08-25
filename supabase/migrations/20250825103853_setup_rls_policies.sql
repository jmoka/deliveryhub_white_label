-- Location: supabase/migrations/20250825103853_setup_rls_policies.sql
-- Schema Analysis: Complete restaurant/food delivery system exists
-- Integration Type: Enhancement - Adding RLS policies to existing schema
-- Dependencies: Existing tables: categories, customers, order_items, orders, products, restaurants, user

-- Create user_profiles intermediary table for PostgREST compatibility
-- This connects auth.users with the existing 'user' table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    legacy_user_id BIGINT REFERENCES public."user"(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'customer',
    phone_e164 BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_legacy_user_id ON public.user_profiles(legacy_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add user_id column to existing tables that need user relationships
-- Only add if they don't already exist
DO $$ 
BEGIN 
    -- Add user_id to orders for user relationship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'user_id' AND table_schema = 'public') THEN
        ALTER TABLE public.orders ADD COLUMN user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
        CREATE INDEX idx_orders_user_id ON public.orders(user_id);
    END IF;
    
    -- Add user_id to customers for user relationship  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'user_id' AND table_schema = 'public') THEN
        ALTER TABLE public.customers ADD COLUMN user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
        CREATE INDEX idx_customers_user_id ON public.customers(user_id);
    END IF;
    
    -- Add user_id to restaurants for owner relationship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'restaurants' AND column_name = 'user_id' AND table_schema = 'public') THEN
        ALTER TABLE public.restaurants ADD COLUMN user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
        CREATE INDEX idx_restaurants_user_id ON public.restaurants(user_id);
    END IF;
END $$;

-- Enable RLS on all existing tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function for role-based access using auth metadata
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- Helper function for role checking using user_profiles
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = required_role
)
$$;

-- RLS Policies using Pattern 1: Core User Tables
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- RLS Policies using Pattern 6: Role-Based Access for user table
CREATE POLICY "admin_manage_users"
ON public."user"
FOR ALL
TO authenticated
USING (public.has_role('admin'));

CREATE POLICY "users_view_own_user_record"
ON public."user"
FOR SELECT
TO authenticated
USING (
    id = (SELECT legacy_user_id FROM public.user_profiles WHERE id = auth.uid())
);

-- RLS Policies using Pattern 4: Public Read, Private Write for restaurants
CREATE POLICY "public_can_read_restaurants"
ON public.restaurants
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_restaurants"
ON public.restaurants
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

CREATE POLICY "owners_manage_own_restaurants"
ON public.restaurants
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies using Pattern 4: Public Read, Private Write for categories
CREATE POLICY "public_can_read_categories"
ON public.categories
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- RLS Policies using Pattern 4: Public Read, Private Write for products
CREATE POLICY "public_can_read_products"
ON public.products
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- RLS Policies using Pattern 2: Simple User Ownership for customers
CREATE POLICY "users_manage_own_customers"
ON public.customers
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_customers"
ON public.customers
FOR ALL
TO authenticated
USING (public.has_role('admin'));

-- RLS Policies using Pattern 2: Simple User Ownership for orders
CREATE POLICY "users_manage_own_orders"
ON public.orders
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.has_role('admin'));

-- RLS Policies for order_items (linked through orders)
CREATE OR REPLACE FUNCTION public.can_access_order_item(item_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.id = item_id 
    AND (o.user_id = auth.uid() OR EXISTS(
        SELECT 1 FROM public.user_profiles up 
        WHERE up.id = auth.uid() AND up.role = 'admin'
    ))
)
$$;

CREATE POLICY "users_access_own_order_items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.can_access_order_item(id))
WITH CHECK (public.can_access_order_item(id));

-- Function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mock data for testing (only if no data exists)
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    customer_uuid UUID := gen_random_uuid();
    restaurant_id BIGINT;
    category_id BIGINT;
    product_id BIGINT;
    customer_id BIGINT;
    order_id BIGINT;
BEGIN
    -- Only create mock data if no users exist
    IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        -- Create auth users with complete field structure
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES
            (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             'admin@deliveryhub.com', crypt('admin123!', gen_salt('bf', 10)), now(), now(), now(),
             '{"name": "Admin User", "role": "admin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
             false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
            (customer_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             'customer@deliveryhub.com', crypt('customer123!', gen_salt('bf', 10)), now(), now(), now(),
             '{"name": "Customer User", "role": "customer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
             false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

        -- Create legacy user records
        INSERT INTO public."user" (name, email, role, phone_e164, password_hash, created_at, updated_at)
        VALUES
            ('Admin User', 'admin@deliveryhub.com', 'admin', 5511999999999, 'hash123', now(), now()),
            ('Customer User', 'customer@deliveryhub.com', 'customer', 5511888888888, 'hash456', now(), now());

        -- Update user_profiles with legacy IDs
        UPDATE public.user_profiles SET legacy_user_id = 1 WHERE email = 'admin@deliveryhub.com';
        UPDATE public.user_profiles SET legacy_user_id = 2 WHERE email = 'customer@deliveryhub.com';

        -- Get IDs for further operations
        SELECT id INTO restaurant_id FROM public.restaurants LIMIT 1;
        SELECT id INTO category_id FROM public.categories LIMIT 1;
        SELECT id INTO product_id FROM public.products LIMIT 1;

        -- Update existing restaurants with user relationship
        UPDATE public.restaurants SET user_id = admin_uuid WHERE id = restaurant_id;

        -- Create a customer record linked to auth user
        INSERT INTO public.customers (name, email, phone_e164, address_json, user_id, created_at, updated_at)
        VALUES ('Customer User', 'customer@deliveryhub.com', 5511888888888, 
                '{"street": "Rua Example", "city": "São Paulo", "state": "SP", "zip": "01234-567"}'::jsonb,
                customer_uuid, now(), now())
        RETURNING id INTO customer_id;

        -- Create an order linked to auth user
        INSERT INTO public.orders (customer_id, restaurant_id, total, status, payment_method, user_id, created_at, updated_at)
        VALUES (customer_id, restaurant_id, 32.40, 'pending', 'pix', customer_uuid, now(), now())
        RETURNING id INTO order_id;

        -- Add order items
        INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, created_at, updated_at)
        VALUES 
            (order_id, product_id, 2, 16.20, now(), now());

        RAISE NOTICE 'Mock data created successfully with admin: % and customer: %', admin_uuid, customer_uuid;
    ELSE
        RAISE NOTICE 'Users already exist, skipping mock data creation';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data creation failed: %', SQLERRM;
END $$;