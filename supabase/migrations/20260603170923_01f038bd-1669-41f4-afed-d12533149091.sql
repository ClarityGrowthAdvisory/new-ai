
ALTER TABLE public.page_view_logs
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE OR REPLACE FUNCTION public.log_page_view(
  p_business_id uuid,
  p_device_type text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.business_profiles WHERE id = p_business_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.page_view_logs (business_id, device_type, country, city, source, user_agent)
  VALUES (
    p_business_id,
    NULLIF(left(coalesce(p_device_type, ''), 20), ''),
    NULLIF(left(coalesce(p_country, ''), 100), ''),
    NULLIF(left(coalesce(p_city, ''), 100), ''),
    NULLIF(left(coalesce(p_source, ''), 20), ''),
    NULLIF(left(coalesce(p_user_agent, ''), 500), '')
  );
END;
$function$;
