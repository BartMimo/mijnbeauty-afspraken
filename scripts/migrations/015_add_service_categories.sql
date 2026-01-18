-- Migration: Add service categories table for salon-specific categories
-- Allows salons to create their own service categories

CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, name) -- Prevent duplicate category names per salon
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_categories_salon_id ON service_categories(salon_id);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "service_categories salon access" ON public.service_categories;
CREATE POLICY "service_categories salon access"
  ON public.service_categories FOR ALL
  TO authenticated
  USING (salon_id IN (
    SELECT id FROM public.salons WHERE owner_id = auth.uid()
  ));

-- Grant permissions
GRANT ALL ON public.service_categories TO authenticated;