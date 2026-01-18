-- Migration: Update claim_and_create_appointment RPC to include staff_id parameter

CREATE OR REPLACE FUNCTION public.claim_and_create_appointment(
    p_deal_id uuid,
    p_user_id uuid,
    p_salon_id uuid,
    p_service_id uuid,
    p_service_name text,
    p_date date,
    p_time text,
    p_price numeric,
    p_customer_name text,
    p_staff_id uuid DEFAULT NULL,
    p_duration_minutes integer DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_deal_id uuid;
    v_app_id uuid;
    v_duration_minutes integer;
BEGIN
    -- Get deal duration and atomically claim the deal only when status is 'active'
    UPDATE deals
    SET status = 'claimed'
    WHERE id = p_deal_id AND status = 'active'
    RETURNING id, duration_minutes INTO v_deal_id, v_duration_minutes;

    -- If no row was returned, the deal was not active anymore
    IF v_deal_id IS NULL THEN
        RETURN NULL; -- signal that the deal couldn't be claimed
    END IF;

    -- Use deal duration, fallback to p_duration_minutes, then to 60 minutes if not set
    v_duration_minutes := COALESCE(v_duration_minutes, p_duration_minutes, 60);

    -- Insert the appointment
    INSERT INTO appointments (
        id, user_id, salon_id, service_id, service_name, date, time, duration_minutes, price, status, customer_name, staff_id
    ) VALUES (
        gen_random_uuid(), p_user_id, p_salon_id, p_service_id, p_service_name, p_date, p_time::time, v_duration_minutes, p_price, 'confirmed', p_customer_name, p_staff_id
    )
    RETURNING id INTO v_app_id;

    RETURN v_app_id;
EXCEPTION WHEN OTHERS THEN
    -- If any error occurred, try to revert the deal status to 'active' (best-effort)
    BEGIN
        UPDATE deals SET status = 'active' WHERE id = p_deal_id;
    EXCEPTION WHEN OTHERS THEN
        -- ignore revert errors
        NULL;
    END;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update grant to include new parameter signature
GRANT EXECUTE ON FUNCTION public.claim_and_create_appointment(uuid, uuid, uuid, uuid, text, date, text, numeric, text, uuid, integer) TO authenticated;