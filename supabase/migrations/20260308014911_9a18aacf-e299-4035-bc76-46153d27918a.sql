
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS enable_feedback_filter boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_predefined_reviews boolean NOT NULL DEFAULT true;
