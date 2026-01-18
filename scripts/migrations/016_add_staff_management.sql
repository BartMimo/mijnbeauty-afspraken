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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_service_id ON service_staff(service_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_staff_id ON service_staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);

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
GRANT ALL ON public.service_staff TO authenticated;