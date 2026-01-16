-- =============================================================
-- SQL Script: Add category and description columns to salons
-- Run this in Supabase SQL Editor if the columns don't exist
-- =============================================================

-- Add category column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salons' AND column_name = 'category'
    ) THEN
        ALTER TABLE salons ADD COLUMN category TEXT DEFAULT 'schoonheid';
    END IF;
END $$;

-- Add description column (if it doesn't exist)  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salons' AND column_name = 'description'
    ) THEN
        ALTER TABLE salons ADD COLUMN description TEXT;
    END IF;
END $$;

-- Verify columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'salons'
ORDER BY ordinal_position;

-- Show sample data
SELECT id, name, category, description, image_url, status 
FROM salons 
LIMIT 5;
