-- Check for deals status constraint and fix if needed
-- Run this in Supabase SQL Editor to diagnose the constraint issue

-- First, check what constraints exist on the deals table
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM
    information_schema.table_constraints tc
LEFT JOIN
    information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'deals'
    AND tc.constraint_type = 'CHECK';

-- Check the current deals table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'deals'
ORDER BY
    ordinal_position;

-- Check what status values currently exist in deals
SELECT DISTINCT status FROM deals WHERE status IS NOT NULL;

-- If the constraint exists and doesn't allow 'inactive', we need to either:
-- 1. Update the constraint to allow 'inactive', or
-- 2. Change the application code to use different status values

-- Option 1: Update the constraint to allow 'active', 'inactive', 'claimed'
-- (Only run this if the constraint exists and needs updating)
-- ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_status_check;
-- ALTER TABLE deals ADD CONSTRAINT deals_status_check CHECK (status IN ('active', 'inactive', 'claimed'));

-- Option 2: If the constraint should only allow 'active' and 'claimed',
-- then update the application code to use 'active'/'claimed' instead of 'active'/'inactive'