
-- FIX 2: Google review URL validation (case-insensitive)
ALTER TABLE public.business_profiles
  ADD CONSTRAINT valid_google_review_url
  CHECK (google_review_url ~* '^https://');

-- FIX 3: Rate-limit negative feedback
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.negative_feedback;

CREATE OR REPLACE FUNCTION public.submit_negative_feedback(
  p_business_id uuid,
  p_rating integer,
  p_feedback_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Invalid rating value';
  END IF;
  IF length(trim(p_feedback_text)) < 1 OR length(trim(p_feedback_text)) > 2000 THEN
    RAISE EXCEPTION 'Feedback must be between 1 and 2000 characters';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.business_profiles WHERE id = p_business_id) THEN
    RAISE EXCEPTION 'Business not found';
  END IF;
  INSERT INTO public.negative_feedback (business_id, rating, feedback_text)
  VALUES (p_business_id, p_rating, trim(p_feedback_text));
END;
$$;

-- FIX 4: Remove public read from reviews/segments (already done via RPCs in previous migration)
DROP POLICY IF EXISTS "Public can read reviews" ON public.positive_reviews;
DROP POLICY IF EXISTS "Public can read segments" ON public.review_segments;

CREATE OR REPLACE FUNCTION public.get_public_reviews(p_business_id uuid)
RETURNS TABLE (id uuid, review_text text, segment_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, review_text, segment_id FROM public.positive_reviews WHERE business_id = p_business_id;
$$;

CREATE OR REPLACE FUNCTION public.get_public_segments(p_business_id uuid)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name FROM public.review_segments WHERE business_id = p_business_id ORDER BY name;
$$;
