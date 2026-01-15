-- DIAGNOSTICS: Test if RLS is blocking the queries
-- Run each query separately to see what's happening

-- 1. Check if you can read salons (unauthenticated)
SELECT id, name, slug, subdomain FROM salons LIMIT 1;

-- 2. Check if Beauty Test Studio exists and has slug
SELECT id, name, slug, subdomain FROM salons WHERE name = 'Beauty Test Studio';

-- 3. Check the actual RLS policies on salons table
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'salons';

-- 4. Disable RLS completely for salons to test
ALTER TABLE salons DISABLE ROW LEVEL SECURITY;

-- 5. Try the query again
SELECT id, name, slug, subdomain FROM salons WHERE slug = 'beauty-test-studio';
