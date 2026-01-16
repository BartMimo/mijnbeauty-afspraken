-- Run deze queries ÉÉN VOOR ÉÉN in Supabase SQL Editor

-- QUERY 1: Check welke tabellen bestaan
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
