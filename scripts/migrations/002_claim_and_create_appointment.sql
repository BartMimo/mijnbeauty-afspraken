-- Migration: atomic claim and create appointment RPC
-- Creates a stored function `claim_and_create_appointment` which:
-- 1) atomically marks a deal as claimed (only if status = 'active')
-- 2) inserts an appointment row in the same transaction
-- Returns the inserted appointment id (uuid) on success, NULL if the deal was not active

-- Ensure pgcrypto is available (for gen_random_uuid) - this is a no-op if the extension exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.claim_and_create_appointment(
    p_deal_id uuid,
    p_user_id uuid,
    p_salon_id uuid,
    p_service_id uuid,
    p_service_name text,
    p_date date,
    p_time text,
    p_duration_minutes integer,
    p_price numeric,
    p_customer_name text
)
RETURNS uuid AS $$
DECLARE
    v_deal_id uuid;
    v_app_id uuid;
BEGIN
    -- Atomically claim the deal only when status is 'active'
    UPDATE deals
    SET status = 'claimed'
    WHERE id = p_deal_id AND status = 'active'
    RETURNING id INTO v_deal_id;

    -- If no row was returned, the deal was not active anymore
    IF v_deal_id IS NULL THEN
        RETURN NULL; -- signal that the deal couldn't be claimed
    END IF;

    -- Insert the appointment
    INSERT INTO appointments (
        id, user_id, salon_id, service_id, service_name, date, time, duration_minutes, price, status, customer_name
    ) VALUES (
        gen_random_uuid(), p_user_id, p_salon_id, p_service_id, p_service_name, p_date, p_time, p_duration_minutes, p_price, 'confirmed', p_customer_name
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

-- Grant execute to authenticated role (optional; adjust according to your RLS)
GRANT EXECUTE ON FUNCTION public.claim_and_create_appointment(uuid, uuid, uuid, uuid, text, date, text, integer, numeric, text) TO authenticated;
