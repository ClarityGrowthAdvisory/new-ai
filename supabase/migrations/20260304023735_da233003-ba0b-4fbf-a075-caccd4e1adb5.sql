
-- Fix page_view_logs: replace open INSERT with RPC
DROP POLICY IF EXISTS "Anyone can insert page view logs" ON public.page_view_logs;

CREATE OR REPLACE FUNCTION public.log_page_view(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.business_profiles WHERE id = p_business_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.page_view_logs (business_id) VALUES (p_business_id);
END;
$$;
