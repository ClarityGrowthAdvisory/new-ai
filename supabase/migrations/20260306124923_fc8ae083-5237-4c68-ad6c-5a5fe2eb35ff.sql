
ALTER TABLE public.negative_feedback 
ADD COLUMN customer_name text NOT NULL DEFAULT '',
ADD COLUMN customer_phone text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.submit_negative_feedback(
  p_business_id uuid, 
  p_rating integer, 
  p_feedback_text text,
  p_customer_name text DEFAULT '',
  p_customer_phone text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  IF length(trim(p_customer_name)) > 200 THEN
    RAISE EXCEPTION 'Name must be under 200 characters';
  END IF;
  IF length(trim(p_customer_phone)) > 20 THEN
    RAISE EXCEPTION 'Phone must be under 20 characters';
  END IF;
  INSERT INTO public.negative_feedback (business_id, rating, feedback_text, customer_name, customer_phone)
  VALUES (p_business_id, p_rating, trim(p_feedback_text), trim(COALESCE(p_customer_name, '')), trim(COALESCE(p_customer_phone, '')));
END;
$$;
