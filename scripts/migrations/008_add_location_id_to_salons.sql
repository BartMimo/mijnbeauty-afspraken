-- Migration: add location_id to salons table, referencing locations
-- Safe to run multiple times
ALTER TABLE IF EXISTS salons
  ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id);

-- Optional: drop old city column if not needed, but keep for now
-- ALTER TABLE salons DROP COLUMN IF EXISTS city;