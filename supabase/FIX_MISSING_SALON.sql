-- FIX: Maak salon aan voor bestaande salon eigenaar
-- Run dit in Supabase SQL Editor

-- 1. Check welke role waarden zijn toegestaan (ENUM)
-- SELECT unnest(enum_range(NULL::user_role));

-- De role is al 'salon', dat is correct - skip update

-- 2. Maak de salon aan
INSERT INTO public.salons (
    owner_id,
    name,
    slug,
    subdomain,
    status,
    city,
    address,
    phone
) VALUES (
    'c2b4c58b-b30e-4c2e-8487-1dd5270e0161',
    'Salon Test 11',
    'salon-test-11',
    'salon-test-11',
    'pending',
    'Amsterdam',
    'Teststraat 11, 1234 AB Amsterdam',
    '0612345678'
);

-- 3. Verifieer dat de salon is aangemaakt
SELECT * FROM public.salons WHERE owner_id = 'c2b4c58b-b30e-4c2e-8487-1dd5270e0161';
