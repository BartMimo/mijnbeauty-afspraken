-- Migration: Add duration_minutes to deals table
-- This allows deals to specify how long the service takes, enabling proper time slot blocking

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Update existing deals to have a default duration of 60 minutes
UPDATE deals SET duration_minutes = 60 WHERE duration_minutes IS NULL;

-- Optional: Add a comment to explain the column
COMMENT ON COLUMN deals.duration_minutes IS 'Duration of the deal service in minutes, used for time slot blocking';