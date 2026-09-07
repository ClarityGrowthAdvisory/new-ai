CREATE OR REPLACE FUNCTION public.get_public_business(p_slug text)
 RETURNS TABLE(id uuid, business_name text, google_review_url text, logo_url text, bg_image_url text, primary_color text, enable_feedback_filter boolean, enable_predefined_reviews boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT bp.id, bp.business_name, bp.google_review_url, bp.logo_url, bp.bg_image_url, bp.primary_color, bp.enable_feedback_filter, bp.enable_predefined_reviews
  FROM public.business_profiles bp
  WHERE bp.slug = p_slug
    AND EXISTS (
      SELECT 1 FROM public.user_plans up
      WHERE up.user_id = bp.user_id
        AND up.expires_at > now()
    )
  LIMIT 1;
$function$;
