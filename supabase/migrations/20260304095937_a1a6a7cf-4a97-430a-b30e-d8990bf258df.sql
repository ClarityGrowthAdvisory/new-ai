CREATE OR REPLACE FUNCTION public.get_public_business(p_slug text)
RETURNS TABLE(id uuid, business_name text, google_review_url text, logo_url text, bg_image_url text, primary_color text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, business_name, google_review_url, logo_url, bg_image_url, primary_color
  FROM public.business_profiles
  WHERE slug = p_slug
  LIMIT 1;
$$;