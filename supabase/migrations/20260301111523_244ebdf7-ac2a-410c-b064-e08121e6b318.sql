
-- Add page_views column to analytics
ALTER TABLE public.analytics ADD COLUMN page_views INTEGER NOT NULL DEFAULT 0;

-- Update the increment_analytics function to support page_views
CREATE OR REPLACE FUNCTION public.increment_analytics(p_business_id uuid, p_column text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.analytics (business_id, five_star_clicks, low_star_submissions, page_views)
  VALUES (p_business_id, 0, 0, 0)
  ON CONFLICT (business_id) DO NOTHING;

  IF p_column = 'five_star_clicks' THEN
    UPDATE public.analytics SET five_star_clicks = five_star_clicks + 1 WHERE business_id = p_business_id;
  ELSIF p_column = 'low_star_submissions' THEN
    UPDATE public.analytics SET low_star_submissions = low_star_submissions + 1 WHERE business_id = p_business_id;
  ELSIF p_column = 'page_views' THEN
    UPDATE public.analytics SET page_views = page_views + 1 WHERE business_id = p_business_id;
  END IF;
END;
$function$;
