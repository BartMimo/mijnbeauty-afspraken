-- Migration: add categories array to salons for salon types
-- Safe to run multiple times
ALTER TABLE IF EXISTS salons
  ADD COLUMN IF NOT EXISTS categories TEXT[];