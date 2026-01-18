-- Migration: Add staff management for salons
-- Allows salons to have multiple staff members with service assignments

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'staff', -- 'owner' or 'staff'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Junction table for service-staff assignments (many-to-many)
CREATE TABLE IF NOT EXISTS public.service_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, staff_id)
);

-- Add staff_id to appointments to track which staff member handles the appointment
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.staff(id);

-- Add payment columns to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash', 'online'));

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_service_id ON service_staff(service_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_staff_id ON service_staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_method ON appointments(payment_method);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff
DROP POLICY IF EXISTS "staff salon access" ON public.staff;
CREATE POLICY "staff salon access"
  ON public.staff FOR ALL
  TO authenticated
  USING (salon_id IN (
    SELECT id FROM public.salons WHERE owner_id = auth.uid()
  ));

-- RLS policies for service_staff
DROP POLICY IF EXISTS "service_staff salon access" ON public.service_staff;
CREATE POLICY "service_staff salon access"
  ON public.service_staff FOR ALL
  TO authenticated
  USING (
    service_id IN (
      SELECT s.id FROM public.services s
      JOIN public.salons salon ON s.salon_id = salon.id
      WHERE salon.owner_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.staff TO authenticated;
GRANT ALL ON public.service_staff TO authenticated;-- Migration: Update claim_and_create_appointment RPC to include payment parameters

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
    p_duration_minutes integer DEFAULT NULL,
    p_payment_method text DEFAULT NULL,
    p_payment_status text DEFAULT 'pending'
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
        id, user_id, salon_id, service_id, service_name, date, time, duration_minutes, price, status, customer_name, staff_id, payment_method, payment_status
    ) VALUES (
        gen_random_uuid(), p_user_id, p_salon_id, p_service_id, p_service_name, p_date, p_time::time, v_duration_minutes, p_price, 'confirmed', p_customer_name, p_staff_id, p_payment_method, p_payment_status
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
GRANT EXECUTE ON FUNCTION public.claim_and_create_appointment(uuid, uuid, uuid, uuid, text, date, text, numeric, text, uuid, integer, text, text) TO authenticated;

-- Migration: Add staff_id to deals table
-- Allows deals to be assigned to specific staff members

ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.staff(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_deals_staff_id ON deals(staff_id);

-- Add status column to deals table for tracking claim status
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired'));

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- Update RLS policies for deals to include staff access
DROP POLICY IF EXISTS "deals salon access" ON public.deals;
CREATE POLICY "deals salon access"
  ON public.deals FOR ALL
  TO authenticated
  USING (salon_id IN (
    SELECT id FROM public.salons WHERE owner_id = auth.uid()
  ));

-- Migration: Add payment settings for salons
-- Allows salons to configure payment methods (cash/online)

ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"cash": true, "online": false}',
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_publishable_key text;

-- Create payments table to track payment transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  method text NOT NULL CHECK (method IN ('cash', 'online')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
DROP POLICY IF EXISTS "payments salon access" ON public.payments;
CREATE POLICY "payments salon access"
  ON public.payments FOR ALL
  TO authenticated
  USING (appointment_id IN (
    SELECT a.id FROM public.appointments a
    JOIN public.salons s ON a.salon_id = s.id
    WHERE s.owner_id = auth.uid()
  ));

-- Allow customers to view their own payments
DROP POLICY IF EXISTS "payments customer access" ON public.payments;
CREATE POLICY "payments customer access"
  ON public.payments FOR SELECT
  TO authenticated
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE user_id = auth.uid()
  ));

-- Grant permissions
GRANT ALL ON public.payments TO authenticated;