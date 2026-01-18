-- Migration: Update deals status constraint to include 'expired'
-- This fixes the constraint violation error when booking deals

-- Drop the existing constraint
ALTER TABLE deals
DROP CONSTRAINT IF EXISTS deals_status_check;

-- Add the updated check constraint for valid status values
ALTER TABLE deals
ADD CONSTRAINT deals_status_check
CHECK (status IN ('active', 'claimed', 'expired'));