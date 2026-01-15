-- =====================================================================
-- CHECK DATA SCRIPT
-- Run this in Supabase SQL Editor to see all data
-- =====================================================================

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count records in each table
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'salons', COUNT(*) FROM public.salons
UNION ALL
SELECT 'services', COUNT(*) FROM public.services
UNION ALL
SELECT 'deals', COUNT(*) FROM public.deals
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments
UNION ALL
SELECT 'favorites', COUNT(*) FROM public.favorites
UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews;

-- Show all salons (regardless of status)
SELECT id, name, status, owner_id, created_at 
FROM public.salons 
ORDER BY created_at DESC;

-- Show all profiles
SELECT id, email, role, full_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Check RLS policies on salons table
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'salons' AND schemaname = 'public';

-- Check if RLS is enabled on salons
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'salons';
