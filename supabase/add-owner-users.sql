-- add-owner-users.sql
-- Creates user accounts for salons that have no owner_id but do have an email,
-- then updates salons.owner_id to point to the created or existing user.

-- 1) Insert missing users (skip if email already exists)
INSERT INTO public.users (id, email, full_name, role)
SELECT gen_random_uuid(), s.email, s.name || ' owner', 'owner'
FROM public.salons s
WHERE s.owner_id IS NULL AND s.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = s.email);

-- 2) Link salons to users by email
UPDATE public.salons s
SET owner_id = u.id
FROM public.users u
WHERE s.owner_id IS NULL AND s.email = u.email;

-- After running, verify:
-- SELECT id, name, owner_id FROM public.salons WHERE owner_id IS NOT NULL;
