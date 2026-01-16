-- Migration: add phone and allow_contact_email to profiles, and add status to deals
-- Add columns if they don't exist (safe to run multiple times)
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS allow_contact_email BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Backfill existing deals to active where null
UPDATE deals SET status = 'active' WHERE status IS NULL;

-- Optional: create an index for faster lookups by salon and status
CREATE INDEX IF NOT EXISTS idx_deals_salon_status ON deals (salon_id, status);
