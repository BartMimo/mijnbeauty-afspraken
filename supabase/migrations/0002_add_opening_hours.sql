-- 0002_add_opening_hours.sql
-- Add opening hours to salons table

ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{
  "ma": {"start": "09:00", "end": "18:00", "closed": false},
  "di": {"start": "09:00", "end": "18:00", "closed": false},
  "wo": {"start": "09:00", "end": "18:00", "closed": false},
  "do": {"start": "09:00", "end": "18:00", "closed": false},
  "vr": {"start": "09:00", "end": "18:00", "closed": false},
  "za": {"start": "10:00", "end": "17:00", "closed": false},
  "zo": {"start": "00:00", "end": "00:00", "closed": true}
}'::jsonb;