-- Add lead_time_hours to salons to allow salons to enforce a minimum booking lead time (in hours)
ALTER TABLE salons
    ADD COLUMN IF NOT EXISTS lead_time_hours INTEGER DEFAULT 0;

-- Optional: set non-null constraint if desired in future migrations
-- ALTER TABLE salons
--     ALTER COLUMN lead_time_hours SET NOT NULL;
