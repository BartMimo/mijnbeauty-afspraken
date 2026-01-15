-- =====================================================================
-- COMPLETE DATABASE SETUP FOR MIJN BEAUTY AFSPRAKEN
-- Run this ENTIRE script in Supabase SQL Editor
-- Creates all tables + RLS policies from scratch
-- =====================================================================

-- =====================================================================
-- STEP 1: CREATE TABLES
-- =====================================================================

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'consumer',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salons table
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  subdomain TEXT UNIQUE,
  description TEXT,
  city TEXT,
  address TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER DEFAULT 30,
  price DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals table (last-minute deals)
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  original_price DECIMAL(10,2),
  discount_price DECIMAL(10,2),
  date DATE,
  time TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, salon_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- STEP 2: DROP ALL EXISTING POLICIES (clean slate)
-- =====================================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- =====================================================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- STEP 4: PROFILES POLICIES
-- =====================================================================
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (
  auth.uid() = id OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);

-- =====================================================================
-- STEP 5: SALONS POLICIES
-- =====================================================================
CREATE POLICY "salons_select" ON public.salons FOR SELECT USING (true);
CREATE POLICY "salons_insert" ON public.salons FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "salons_update" ON public.salons FOR UPDATE USING (
  auth.uid() = owner_id OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "salons_delete" ON public.salons FOR DELETE USING (
  auth.uid() = owner_id OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);

-- =====================================================================
-- STEP 6: SERVICES POLICIES
-- =====================================================================
CREATE POLICY "services_select" ON public.services FOR SELECT USING (true);
CREATE POLICY "services_insert" ON public.services FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "services_update" ON public.services FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "services_delete" ON public.services FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);

-- =====================================================================
-- STEP 7: DEALS POLICIES
-- =====================================================================
CREATE POLICY "deals_select" ON public.deals FOR SELECT USING (true);
CREATE POLICY "deals_insert" ON public.deals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "deals_update" ON public.deals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "deals_delete" ON public.deals FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);

-- =====================================================================
-- STEP 8: APPOINTMENTS POLICIES
-- =====================================================================
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);

-- =====================================================================
-- STEP 9: FAVORITES POLICIES
-- =====================================================================
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================
-- STEP 10: REVIEWS POLICIES
-- =====================================================================
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (
  auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (
  auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@bart.nl'
);

-- =====================================================================
-- STEP 11: PROFILE TRIGGER (auto-create profile on signup)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    role = COALESCE(NULLIF(EXCLUDED.role, 'consumer'), profiles.role),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- STEP 12: GRANT PERMISSIONS
-- =====================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.salons TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.reviews TO authenticated;

GRANT SELECT ON public.salons TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.deals TO anon;
GRANT SELECT ON public.reviews TO anon;

-- =====================================================================
-- STEP 13: INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_salons_owner ON public.salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_status ON public.salons(status);
CREATE INDEX IF NOT EXISTS idx_salons_slug ON public.salons(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_services_salon ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_deals_salon ON public.deals(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon ON public.appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_salon ON public.reviews(salon_id);

-- =====================================================================
-- DONE! Database is ready.
-- 
-- Tables created:
-- - profiles (linked to auth.users)
-- - salons
-- - services
-- - deals
-- - appointments
-- - favorites
-- - reviews
--
-- Now you can register a salon account!
-- =====================================================================
