
-- Create review_segments table
CREATE TABLE public.review_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add segment_id to positive_reviews (nullable for backward compat)
ALTER TABLE public.positive_reviews
  ADD COLUMN segment_id UUID REFERENCES public.review_segments(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.review_segments ENABLE ROW LEVEL SECURITY;

-- Owners can manage their segments
CREATE POLICY "Owners can manage segments"
  ON public.review_segments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.business_profiles bp
    WHERE bp.id = review_segments.business_id AND bp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.business_profiles bp
    WHERE bp.id = review_segments.business_id AND bp.user_id = auth.uid()
  ));

-- Public can read segments (for public review page)
CREATE POLICY "Public can read segments"
  ON public.review_segments
  FOR SELECT
  USING (true);
