-- Fix test salon: add slug and subdomain
UPDATE salons 
SET 
  slug = 'beauty-test-studio',
  subdomain = 'beauty-test'
WHERE name = 'Beauty Test Studio';

-- Verify the update
SELECT id, name, slug, subdomain FROM salons WHERE name = 'Beauty Test Studio';
