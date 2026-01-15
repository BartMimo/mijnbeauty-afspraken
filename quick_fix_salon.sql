-- Quick fix for Beauty Test Studio
-- Run this NOW in Supabase SQL Editor

-- First, drop any existing problematic triggers on favorites
DROP TRIGGER IF EXISTS update_favorites_updated_at ON favorites;

-- Update the test salon
UPDATE salons 
SET 
    slug = 'beauty-test-studio',
    subdomain = 'beauty-test',
    description = 'Professional beauty salon offering nail services, lashes, and more'
WHERE name = 'Beauty Test Studio';

-- Verify it worked
SELECT id, name, slug, subdomain, city, image_url FROM salons WHERE name = 'Beauty Test Studio';
