-- SAFE FIX: Only create triggers for tables that actually have updated_at column
-- Run this in Supabase SQL Editor

-- First, drop ALL existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS update_favorites_updated_at ON favorites;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create triggers on tables that have updated_at column
DO $$
BEGIN
    -- Check and create trigger for profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='profiles' AND column_name='updated_at') THEN
        EXECUTE 'CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
    
    -- Check and create trigger for salons
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='salons' AND column_name='updated_at') THEN
        EXECUTE 'CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons 
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
    
    -- Check and create trigger for services
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='services' AND column_name='updated_at') THEN
        EXECUTE 'CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
    
    -- Check and create trigger for deals
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='deals' AND column_name='updated_at') THEN
        EXECUTE 'CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals 
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
    
    -- Check and create trigger for appointments
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='appointments' AND column_name='updated_at') THEN
        EXECUTE 'CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments 
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
    
    -- Check and create trigger for reviews
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='reviews' AND column_name='updated_at') THEN
        EXECUTE 'CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews 
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
END $$;

-- Update test salon
UPDATE salons 
SET 
    slug = 'beauty-test-studio',
    subdomain = 'beauty-test',
    description = 'Professional beauty salon offering nail services, lashes, and more'
WHERE name = 'Beauty Test Studio';

-- Verify
SELECT id, name, slug, subdomain FROM salons WHERE name = 'Beauty Test Studio';
