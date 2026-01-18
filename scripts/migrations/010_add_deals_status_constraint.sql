-- Migration: Add status check constraint to deals table
-- This ensures only valid status values are allowed

-- First, ensure the status column exists (from previous migration)
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add the check constraint for valid status values
ALTER TABLE deals
ADD CONSTRAINT deals_status_check
CHECK (status IN ('active', 'claimed', 'expired'));

-- Update any existing 'inactive' statuses to 'active' (if they exist)
UPDATE deals SET status = 'active' WHERE status = 'inactive';

-- Backfill any NULL statuses to 'active'
UPDATE deals SET status = 'active' WHERE status IS NULL;