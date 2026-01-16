-- Migration: add service-related columns to appointments to avoid missing-column errors
-- Safe to run multiple times
ALTER TABLE IF EXISTS appointments
  ADD COLUMN IF NOT EXISTS service_id UUID,
  ADD COLUMN IF NOT EXISTS service_name TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';

-- Optional: create an index for faster lookups by salon and status (if applicable)
CREATE INDEX IF NOT EXISTS idx_appointments_salon_status ON appointments (salon_id, status);

-- Basic backfill for status if rows exist without it
UPDATE appointments SET status = 'confirmed' WHERE status IS NULL;