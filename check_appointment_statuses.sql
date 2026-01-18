-- Check for appointment status inconsistencies
-- Run this in Supabase SQL Editor to identify potential issues

-- Check appointments that are 'confirmed' but in the past (should be 'completed')
SELECT
    id,
    date,
    time,
    status,
    customer_name,
    salon_id
FROM appointments
WHERE status = 'confirmed'
AND date < CURRENT_DATE
ORDER BY date DESC
LIMIT 20;

-- Check total appointments by status
SELECT
    status,
    COUNT(*) as count,
    SUM(price) as total_revenue
FROM appointments
GROUP BY status
ORDER BY status;

-- Check if there are appointments with invalid statuses
SELECT DISTINCT status FROM appointments WHERE status NOT IN ('confirmed', 'completed', 'pending', 'cancelled');

-- Optional: Auto-complete past confirmed appointments
-- UPDATE appointments
-- SET status = 'completed'
-- WHERE status = 'confirmed'
-- AND date < CURRENT_DATE;