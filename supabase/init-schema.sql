-- Full minimal schema for the app (salons, users, services, appointments, deals, reviews)
-- This version uses UUID primary keys (recommended for Supabase projects).
-- Paste into Supabase Project -> SQL -> New query and run it.
-- If your existing tables use text IDs, see the notes at the end for ALTER commands.

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  full_name text,
  role text,
  created_at timestamptz DEFAULT now()
);

-- Salons table
CREATE TABLE IF NOT EXISTS public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain text UNIQUE,
  name text,
  description text,
  address text,
  city text,
  zip_code text,
  image text,
  rating numeric,
  "reviewCount" integer,
  owner_id uuid REFERENCES public.users(id),
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Services offered by salons
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  name text,
  description text,
  price numeric,
  duration_minutes integer,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id),
  user_id uuid REFERENCES public.users(id),
  date date,
  time text,
  status text,
  price numeric,
  customer_name text,
  created_at timestamptz DEFAULT now()
);

-- Deals / last-minute offers
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  service_name text,
  original_price numeric,
  discount_price numeric,
  "date" text,
  "time" text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  salon_id uuid REFERENCES public.salons(id),
  rating smallint,
  text text,
  created_at timestamptz DEFAULT now()
);

-- Useful index
CREATE INDEX IF NOT EXISTS idx_salons_city ON public.salons(city);
CREATE INDEX IF NOT EXISTS idx_services_salon ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon ON public.appointments(salon_id);

-- Notes / Migration tips:
-- If your existing tables already contain non-UUID text IDs that are valid UUID strings, you can convert a column like this:
--   ALTER TABLE public.salons ALTER COLUMN id TYPE uuid USING id::uuid;
--   ALTER TABLE public.services ALTER COLUMN salon_id TYPE uuid USING salon_id::uuid;
-- If your existing values are not valid UUIDs, consider creating new uuid-id columns and mapping old IDs to them, or keep text IDs and use the mapping feature in the importer to rename incoming fields to match your current columns.

