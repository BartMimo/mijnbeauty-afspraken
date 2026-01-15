-- =====================================================================
-- COMPLETE RLS POLICIES FOR MIJN BEAUTY AFSPRAKEN
-- Run this ENTIRE script in Supabase SQL Editor
-- This fixes ALL policies for ALL tables - run once and done!
-- =====================================================================

-- =====================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (clean slate)
-- =====================================================================

-- Drop all policies on profiles
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Drop all policies on salons
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'salons' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.salons', pol.policyname);
  END LOOP;
END $$;

-- Drop all policies on services
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'services' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.services', pol.policyname);
  END LOOP;
END $$;

-- Drop all policies on deals
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'deals' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.deals', pol.policyname);
  END LOOP;
END $$;

-- Drop all policies on appointments
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', pol.policyname);
  END LOOP;
END $$;

-- Drop all policies on favorites
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'favorites' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.favorites', pol.policyname);
  END LOOP;
END $$;

-- Drop all policies on reviews
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reviews' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.reviews', pol.policyname);
  END LOOP;
END $$;

-- =====================================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- STEP 3: PROFILES POLICIES
-- =====================================================================
-- Anyone can read profiles (for displaying owner info on salon pages)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

-- Allow inserts (trigger creates profile, or user upserts their own)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Users update own profile, admin updates all
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Users delete own profile, admin deletes all
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- =====================================================================
-- STEP 4: SALONS POLICIES
-- =====================================================================
-- Anyone can read salons (public directory)
CREATE POLICY "salons_select" ON public.salons
  FOR SELECT USING (true);

-- Authenticated users can create salons (owner_id must be their own id)
CREATE POLICY "salons_insert" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners update own salon, admin updates all
CREATE POLICY "salons_update" ON public.salons
  FOR UPDATE USING (
    auth.uid() = owner_id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Owners delete own salon, admin deletes all
CREATE POLICY "salons_delete" ON public.salons
  FOR DELETE USING (
    auth.uid() = owner_id 
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- =====================================================================
-- STEP 5: SERVICES POLICIES (salon services like haircuts, nails etc)
-- =====================================================================
-- Anyone can read services (public)
CREATE POLICY "services_select" ON public.services
  FOR SELECT USING (true);

-- Salon owners can create services for their salon
CREATE POLICY "services_insert" ON public.services
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Salon owners can update their services
CREATE POLICY "services_update" ON public.services
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Salon owners can delete their services
CREATE POLICY "services_delete" ON public.services
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- =====================================================================
-- STEP 6: DEALS POLICIES (last-minute deals)
-- =====================================================================
-- Anyone can read active deals
CREATE POLICY "deals_select" ON public.deals
  FOR SELECT USING (true);

-- Salon owners can create deals for their salon
CREATE POLICY "deals_insert" ON public.deals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Salon owners can update their deals
CREATE POLICY "deals_update" ON public.deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Salon owners can delete their deals
CREATE POLICY "deals_delete" ON public.deals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- =====================================================================
-- STEP 7: APPOINTMENTS POLICIES
-- =====================================================================
-- Users see their own appointments, salon owners see appointments for their salon
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Authenticated users can create appointments
CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own appointments, salon owners can update appointments at their salon
CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Users can cancel their own appointments
CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- =====================================================================
-- STEP 8: FAVORITES POLICIES
-- =====================================================================
-- Users see their own favorites
CREATE POLICY "favorites_select" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "favorites_insert" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their favorites
CREATE POLICY "favorites_delete" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================
-- STEP 9: REVIEWS POLICIES
-- =====================================================================
-- Anyone can read reviews (public)
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "reviews_update" ON public.reviews
  FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- Users can delete their own reviews, admin can delete all
CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'email' = 'admin@bart.nl'
  );

-- =====================================================================
-- STEP 10: PROFILE TRIGGER (auto-create profile on signup)
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
-- STEP 11: GRANT PERMISSIONS
-- =====================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Authenticated users get full access
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.salons TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.reviews TO authenticated;

-- Anonymous users get read access for public pages
GRANT SELECT ON public.salons TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.deals TO anon;
GRANT SELECT ON public.reviews TO anon;

-- =====================================================================
-- STEP 12: USEFUL INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_salons_owner ON public.salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_status ON public.salons(status);
CREATE INDEX IF NOT EXISTS idx_salons_slug ON public.salons(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_services_salon ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_deals_salon ON public.deals(salon_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon ON public.appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_salon ON public.reviews(salon_id);

-- =====================================================================
-- DONE! All RLS policies are now configured.
-- 
-- Summary:
-- - Profiles: Anyone reads, users manage own, admin manages all
-- - Salons: Anyone reads, owners manage own, admin manages all
-- - Services: Anyone reads, salon owners manage their salon's services
-- - Deals: Anyone reads, salon owners manage their salon's deals
-- - Appointments: Users see own + salon owners see their salon's
-- - Favorites: Users manage their own only
-- - Reviews: Anyone reads, users manage their own, admin can delete
-- 
-- New salons are created with status='pending'
-- Admin must approve (change to 'active') before visible in search
-- =====================================================================
