-- ADD MISSING COLUMNS TO APPOINTMENTS
-- Run this in Supabase SQL Editor

-- Add duration_minutes column to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- Add staff_name column to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- Add end_time for easier querying of overlaps
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Create index for faster date/time queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(salon_id, date, time);

-- Verify columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;
