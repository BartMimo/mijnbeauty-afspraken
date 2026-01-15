-- Fix salon registration RLS policies
-- Run this in Supabase SQL Editor

-- Ensure profile trigger exists for auto-creating profiles on signup
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
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure profiles can be inserted/upserted by their owners
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;
CREATE POLICY "Users can upsert own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure salon owners can create their salon
DROP POLICY IF EXISTS "Owners can create salons" ON public.salons;
CREATE POLICY "Owners can create salons" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Verify subdomain checking works for all authenticated users
DROP POLICY IF EXISTS "Anyone can check salon subdomains" ON public.salons;
CREATE POLICY "Anyone can check salon subdomains" ON public.salons
  FOR SELECT USING (true);

-- Note: owner_id NOT NULL constraint skipped - existing salons may have NULL values
-- If you want to enforce this, first update or delete salons without owner_id:
-- DELETE FROM public.salons WHERE owner_id IS NULL;
-- Then run: ALTER TABLE public.salons ALTER COLUMN owner_id SET NOT NULL;

-- Add some helpful indices if they don't exist
CREATE INDEX IF NOT EXISTS idx_salons_owner ON public.salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.salons TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.reviews TO authenticated;

-- Enable RLS (make sure it's enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
