-- Debug script: Check appointment statuses and revenue calculation
-- Run this in Supabase SQL Editor to diagnose the cancelled appointment issue

-- Check all appointments for a specific salon (replace 'salon-id-here' with actual salon ID)
-- SELECT id, date, time, status, price, customer_name
-- FROM appointments
-- WHERE salon_id = 'salon-id-here'
-- ORDER BY date DESC, time DESC;

-- Check revenue calculation for current month
SELECT
    DATE_TRUNC('month', CURRENT_DATE) as current_month,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as non_cancelled_appointments,
    SUM(CASE WHEN status != 'cancelled' AND date <= CURRENT_DATE THEN price ELSE 0 END) as calculated_revenue
FROM appointments
WHERE salon_id = 'your-salon-id-here'  -- Replace with actual salon ID
AND date >= DATE_TRUNC('month', CURRENT_DATE)
AND date <= CURRENT_DATE;

-- Check if there are appointments that should be cancelled but aren't
SELECT id, date, status, customer_name, created_at
FROM appointments
WHERE status = 'confirmed'
AND date < CURRENT_DATE - INTERVAL '1 day'  -- Appointments more than 1 day old that are still confirmed
ORDER BY date DESC;

-- Check cancelled appointments that might still be counted
SELECT id, date, status, price, customer_name
FROM appointments
WHERE status = 'cancelled'
AND date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY date DESC;