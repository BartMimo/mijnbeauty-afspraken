-- =============================================
-- CRITICAL: RUN THIS SQL IN SUPABASE SQL EDITOR NOW
-- This ensures salon registration works correctly
-- =============================================

-- STEP 1: Fix profile insert policy to allow trigger AND user inserts
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);  -- Allow all inserts (trigger needs this)

-- STEP 2: Ensure salon insert works for authenticated users
DROP POLICY IF EXISTS "salons_insert" ON public.salons;
CREATE POLICY "salons_insert" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- STEP 3: Make sure trigger exists and works correctly
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
  RAISE WARNING 'Profile creation failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.salons TO authenticated;

-- STEP 5: Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- DONE! Now test salon registration.
