DO $$
BEGIN
  -- If the camelCase column exists (created by older schema), rename it to snake_case
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'zipCode'
  ) THEN
    ALTER TABLE public.salons RENAME COLUMN "zipCode" TO zip_code;
  END IF;
END
$$;

-- Ensure column exists (idempotent)
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS zip_code text;
