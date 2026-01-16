-- Migration: make user_id nullable in appointments to allow guest bookings
-- Safe to run multiple times
ALTER TABLE IF EXISTS appointments
  ALTER COLUMN user_id DROP NOT NULL;