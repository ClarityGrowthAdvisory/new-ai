ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6b46c1',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Space Grotesk';