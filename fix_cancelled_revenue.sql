-- Emergency fix: Force update all cancelled appointments and clean up revenue calculation
-- Run this in Supabase SQL Editor if cancelled appointments are still showing in revenue

-- Step 1: Ensure all past confirmed appointments are marked as completed
SELECT auto_complete_past_appointments();

-- Step 2: Check for any data inconsistencies
SELECT
    status,
    COUNT(*) as count,
    SUM(price) as total_value
FROM appointments
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY status
ORDER BY status;

-- Step 3: Manual verification - check appointments that should not be counted in revenue
SELECT id, date, time, status, price, customer_name, salon_id
FROM appointments
WHERE status NOT IN ('confirmed', 'completed')
AND date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY date DESC;

-- Step 4: If you need to manually fix any appointments, uncomment and modify:
-- UPDATE appointments SET status = 'cancelled' WHERE id = 'problematic-appointment-id';

-- Step 5: Verify revenue calculation matches dashboard
SELECT
    SUM(price) as should_be_revenue,
    COUNT(*) as should_be_count
FROM appointments
WHERE status IN ('confirmed', 'completed')
AND date >= DATE_TRUNC('month', CURRENT_DATE)
AND date <= CURRENT_DATE;