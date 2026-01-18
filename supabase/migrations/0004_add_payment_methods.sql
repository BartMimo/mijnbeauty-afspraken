-- Add payment_methods column to salons table
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"cash": true, "online": false}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.salons.payment_methods IS 'Payment methods accepted by the salon: {cash: boolean, online: boolean}';