-- Migration: Change time columns from text to time without time zone
-- This fixes type mismatch errors when inserting time values

-- Alter appointments table if it's not already time type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointments' AND column_name = 'time' AND data_type = 'text'
    ) THEN
        ALTER TABLE appointments
        ALTER COLUMN time TYPE time without time zone USING time::time without time zone;
    END IF;
END $$;

-- Alter deals table if it's not already time type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'time' AND data_type = 'text'
    ) THEN
        ALTER TABLE deals
        ALTER COLUMN "time" TYPE time without time zone USING "time"::time without time zone;
    END IF;
END $$;