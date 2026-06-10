
DROP FUNCTION IF EXISTS public.get_public_business(text);

CREATE FUNCTION public.get_public_business(p_slug text)
RETURNS TABLE(id uuid, business_name text, google_review_url text, logo_url text, bg_image_url text, primary_color text, enable_feedback_filter boolean, enable_predefined_reviews boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, business_name, google_review_url, logo_url, bg_image_url, primary_color, enable_feedback_filter, enable_predefined_reviews
  FROM public.business_profiles
  WHERE slug = p_slug
  LIMIT 1;
$$;
