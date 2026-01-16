-- QUERY 4: Check RLS policies op salons
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'salons';
