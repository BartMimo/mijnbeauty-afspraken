-- 0003_add_updated_at_to_tables.sql
-- Add updated_at columns to tables that need them to fix update trigger errors

-- Add updated_at to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to salons table
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to deals table
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create a trigger function to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables that have updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salons_updated_at ON public.salons;
CREATE TRIGGER update_salons_updated_at
    BEFORE UPDATE ON public.salons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();