-- STAP 1: Check de huidige situatie
-- Run dit eerst om te zien wat er mis is:

-- Bekijk auth.users id voor admin
SELECT id, email FROM auth.users WHERE email = 'admin@bart.nl';

-- Bekijk profiles id voor admin  
SELECT id, email, role FROM public.profiles WHERE email = 'admin@bart.nl';

-- Als de IDs NIET overeenkomen, run dan STAP 2:

-- STAP 2: Fix het profiel
-- Verwijder het oude profiel en maak een nieuwe met de juiste ID

-- Verwijder eerst het oude profiel met verkeerde ID
DELETE FROM public.profiles WHERE email = 'admin@bart.nl';

-- Maak een nieuw profiel met de JUISTE auth.users ID
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
    id,
    email,
    'admin',
    'Admin'
FROM auth.users 
WHERE email = 'admin@bart.nl';

-- STAP 3: Verifieer dat het gefixt is
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'admin@bart.nl';
