-- Migration: add latitude and longitude to salons for distance filtering
-- Safe to run multiple times
ALTER TABLE IF EXISTS salons
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Optional: create an index for location queries
CREATE INDEX IF NOT EXISTS idx_salons_location ON salons (latitude, longitude);