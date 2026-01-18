-- Migration: Add function and trigger to auto-complete past appointments
-- This ensures accurate revenue reporting by marking past confirmed appointments as completed

CREATE OR REPLACE FUNCTION auto_complete_past_appointments()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update confirmed appointments that are in the past to completed
    UPDATE appointments
    SET status = 'completed'
    WHERE status = 'confirmed'
    AND date < CURRENT_DATE;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_complete_past_appointments() TO authenticated;

-- Create a trigger function to auto-complete appointments when they become past due
CREATE OR REPLACE FUNCTION trigger_auto_complete_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- If the appointment date has passed and it's still confirmed, mark as completed
    IF NEW.status = 'confirmed' AND NEW.date < CURRENT_DATE THEN
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on appointments table (AFTER INSERT OR UPDATE)
DROP TRIGGER IF EXISTS auto_complete_appointment_trigger ON appointments;
CREATE TRIGGER auto_complete_appointment_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_complete_appointment();

-- Optional: Run the function immediately to clean up existing data
SELECT auto_complete_past_appointments();

-- Also create a function to manually clean up cancelled appointments that might have wrong status
CREATE OR REPLACE FUNCTION cleanup_cancelled_appointments()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- This function can be called manually if needed to fix any data inconsistencies
    -- Update any appointments that are marked as cancelled but should be properly cancelled
    UPDATE appointments
    SET status = 'cancelled'
    WHERE status IN ('confirmed', 'completed')
    AND id IN (
        SELECT a.id FROM appointments a
        WHERE a.status IN ('confirmed', 'completed')
        AND EXISTS (
            SELECT 1 FROM appointments b
            WHERE b.id = a.id
            AND b.status = 'cancelled'
        )
    );

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;