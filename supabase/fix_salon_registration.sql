-- Fix salon registration RLS policies - NO RECURSION VERSION
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES ON PROFILES
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES ON SALONS
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'salons' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.salons', pol.policyname);
  END LOOP;
END $$;

-- ============================================
-- STEP 3: CREATE SIMPLE PROFILE POLICIES (NO SUBQUERIES)
-- ============================================

-- Anyone can read profiles (needed for displaying salon owner info, etc.)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile, admin can update all profiles
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Users can delete their own profile, admin can delete all profiles
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- ============================================
-- STEP 4: CREATE SIMPLE SALON POLICIES (NO SUBQUERIES)
-- ============================================

-- Anyone can read salons (public directory)
CREATE POLICY "salons_select" ON public.salons
  FOR SELECT USING (true);

-- Authenticated users can create salons with themselves as owner
CREATE POLICY "salons_insert" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own salon, admin can update all
CREATE POLICY "salons_update" ON public.salons
  FOR UPDATE USING (
    auth.uid() = owner_id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Owners can delete their own salon, admin can delete all
CREATE POLICY "salons_delete" ON public.salons
  FOR DELETE USING (
    auth.uid() = owner_id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- ============================================
-- STEP 5: PROFILE TRIGGER (SECURITY DEFINER bypasses RLS)
-- ============================================
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
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Profile creation failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 6: INDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_salons_owner ON public.salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- STEP 7: PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.salons TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.reviews TO authenticated;

-- Read access for anonymous users (public pages)
GRANT SELECT ON public.salons TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.deals TO anon;
GRANT SELECT ON public.reviews TO anon;

-- ============================================
-- STEP 8: ENABLE RLS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 9: DEALS POLICIES (for last-minute deals)
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'deals' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.deals', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Anyone can view deals (public)
CREATE POLICY "deals_select" ON public.deals
  FOR SELECT USING (true);

-- Salon owners can manage their deals
CREATE POLICY "deals_insert" ON public.deals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );

CREATE POLICY "deals_update" ON public.deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );

CREATE POLICY "deals_delete" ON public.deals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );

-- ============================================
-- STEP 10: SERVICES POLICIES
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'services' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.services', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "services_insert" ON public.services
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );

CREATE POLICY "services_update" ON public.services
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );

CREATE POLICY "services_delete" ON public.services
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );
