ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"cash": true, "online": false}'::jsonb;
