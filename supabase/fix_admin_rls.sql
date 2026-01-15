-- FIX ADMIN RLS POLICIES
-- Run this in Supabase SQL Editor to allow admin@bart.nl full admin access
-- This adds a check for the hardcoded admin email alongside the role check

-- Admin read access (all data) - checks role OR hardcoded admin email
DROP POLICY IF EXISTS "Admins can read profiles" ON public.profiles;
CREATE POLICY "Admins can read profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can read salons" ON public.salons;
CREATE POLICY "Admins can read salons" ON public.salons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can update salons" ON public.salons;
CREATE POLICY "Admins can update salons" ON public.salons
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can delete salons" ON public.salons;
CREATE POLICY "Admins can delete salons" ON public.salons
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can read services" ON public.services;
CREATE POLICY "Admins can read services" ON public.services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can read deals" ON public.deals;
CREATE POLICY "Admins can read deals" ON public.deals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can read appointments" ON public.appointments;
CREATE POLICY "Admins can read appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can read favorites" ON public.favorites;
CREATE POLICY "Admins can read favorites" ON public.favorites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );

DROP POLICY IF EXISTS "Admins can read reviews" ON public.reviews;
CREATE POLICY "Admins can read reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email = 'admin@bart.nl')
  );
