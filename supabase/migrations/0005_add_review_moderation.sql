-- 0005_add_review_moderation.sql
-- Add moderation fields to reviews table

-- Add moderation columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason text,
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
ADD COLUMN IF NOT EXISTS comment text;

-- Update existing reviews to be approved by default
UPDATE public.reviews SET is_approved = true WHERE is_approved IS NULL;

-- Create index for moderation queries
CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON public.reviews(is_approved, is_flagged, created_at DESC);

-- Create index for flagged reviews
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON public.reviews(is_flagged) WHERE is_flagged = true;