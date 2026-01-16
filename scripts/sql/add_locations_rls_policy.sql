-- Add RLS policy for locations table to allow public read access
-- Run this in Supabase SQL Editor if locations are not loading

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read locations (for search functionality)
CREATE POLICY "locations_select" ON public.locations
  FOR SELECT USING (true);