-- Migration: Add soft delete to profiles table
-- Adds deleted_at column for soft delete functionality

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for better performance on deleted users queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles (deleted_at);

-- Update RLS policies to exclude soft-deleted users
-- Note: This assumes you have RLS enabled on profiles table
