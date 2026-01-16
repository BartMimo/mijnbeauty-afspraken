-- Migration: create locations table for Dutch cities/postcodes with precise lat/lng
-- Safe to run multiple times
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  postcode VARCHAR(10),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  province VARCHAR(100),
  UNIQUE(city, postcode)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations (city);
CREATE INDEX IF NOT EXISTS idx_locations_postcode ON locations (postcode);