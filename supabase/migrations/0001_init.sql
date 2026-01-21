-- 0001_init.sql
-- Initial migration: create basic schema

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  full_name text,
  role text,
  created_at timestamptz DEFAULT now()
);

-- Salons
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
  slug text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Services
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

-- Deals
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_salons_city ON public.salons(city);
CREATE INDEX IF NOT EXISTS idx_services_salon ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon ON public.appointments(salon_id);
