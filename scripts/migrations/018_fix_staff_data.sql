-- Migration 018: Fix staff schema/data inconsistencies
-- - add missing is_active column (if absent)
-- - normalize invalid role values to 'admin' (avoids CHECK constraint failures)
-- - remove trailing " Eigenaar" suffix from names
-- - backfill name/email from profiles when user_id is set
-- - insert idempotent fallback owner staff rows for salons without staff
-- - create service_staff entries for owner fallback rows
-- Run in staging first. This script is idempotent.

BEGIN;

-- SAFETY BACKUP (idempotent): copy current staff rows to a backup table (one-time)
CREATE TABLE IF NOT EXISTS public.staff_backup_018_fix AS
SELECT * FROM public.staff WHERE false;

INSERT INTO public.staff_backup_018_fix
SELECT * FROM public.staff
WHERE NOT EXISTS (SELECT 1 FROM public.staff_backup_018_fix b WHERE b.id = public.staff.id);

-- 1) Add is_active if missing (makes queries that filter on is_active safe)
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2) Normalize invalid role values to an allowed role ('admin')
UPDATE public.staff
SET role = 'admin'
WHERE role IS NULL
  OR role NOT IN ('stylist','therapist','admin');

-- 3) Remove trailing ' Eigenaar' suffix from existing names (case-insensitive)
UPDATE public.staff
SET name = regexp_replace(name, '\\s+Eigenaar$', '', 'i')
WHERE name ~* '\\s+Eigenaar$';

-- 4) Backfill name/email from auth.profiles when user_id is linked
UPDATE public.staff s
SET name = COALESCE(NULLIF(s.name, ''), p.full_name),
    email = COALESCE(NULLIF(s.email, ''), p.email)
FROM public.profiles p
WHERE s.user_id = p.id
  AND (s.name IS NULL OR s.name = '' OR s.email IS NULL OR s.email = '');

-- 5) Insert idempotent fallback owner-staff rows for salons that have no staff but do have an owner
WITH salons_no_staff AS (
  SELECT s.id AS salon_id, s.owner_id, COALESCE(p.full_name, s.name) AS owner_name, COALESCE(p.email, s.email) AS owner_email
  FROM public.salons s
  LEFT JOIN public.staff st ON st.salon_id = s.id
  LEFT JOIN public.profiles p ON p.id = s.owner_id
  WHERE st.id IS NULL
    AND s.owner_id IS NOT NULL
)
INSERT INTO public.staff (id, salon_id, user_id, name, email, role, created_at)
SELECT gen_random_uuid(), salon_id, owner_id, owner_name, owner_email, 'admin', now()
FROM salons_no_staff s
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff st WHERE st.salon_id = s.salon_id
);

-- 6) Create service_staff assignments for owner fallback rows (idempotent)
INSERT INTO public.service_staff (id, service_id, staff_id, created_at)
SELECT gen_random_uuid(), svc.id, st.id, now()
FROM public.services svc
JOIN public.salons s ON s.id = svc.salon_id
JOIN public.staff st ON st.salon_id = s.id AND st.user_id = s.owner_id
LEFT JOIN public.service_staff ss ON ss.service_id = svc.id AND ss.staff_id = st.id
WHERE ss.id IS NULL;

COMMIT;

-- ----------------------
-- Verification queries (run after migration)
-- ----------------------
-- 1) Check there are no invalid roles left:
-- SELECT role, count(*) FROM public.staff GROUP BY role ORDER BY count DESC;

-- 2) Ensure no names end with 'Eigenaar':
-- SELECT id, name FROM public.staff WHERE name ILIKE '% Eigenaar%' LIMIT 50;

-- 3) Ensure nested selects work for deals/staff:
-- SELECT id, staff_id, (SELECT row_to_json(st) FROM (SELECT id, name FROM public.staff WHERE id = deals.staff_id) st) AS staff
-- FROM public.deals WHERE salon_id = '<SALON_UUID>' LIMIT 5;

-- 4) Spot-check a salon that previously failed:
-- SELECT id, name, role, is_active, user_id FROM public.staff WHERE salon_id = '<SALON_UUID>' LIMIT 20;

-- ----------------------
-- Rollback (manual):
-- If you need to rollback, restore from the backup table created above:
-- BEGIN; TRUNCATE public.staff; INSERT INTO public.staff SELECT * FROM public.staff_backup_018_fix; COMMIT;
-- ----------------------
