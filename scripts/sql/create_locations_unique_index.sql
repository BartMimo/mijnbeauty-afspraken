-- Create a unique index to allow safe UPSERTs on (postcode, city)
-- Run this on your database (psql or Supabase SQL editor)

CREATE UNIQUE INDEX IF NOT EXISTS locations_postcode_city_unique
ON public.locations (postcode, city);
