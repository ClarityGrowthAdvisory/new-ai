
-- Create a secure function to delete a review after it's been copied on the public page
-- This validates the review belongs to the specified business before deleting
CREATE OR REPLACE FUNCTION public.delete_copied_review(p_review_id uuid, p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the review belongs to the specified business before deleting
  DELETE FROM public.positive_reviews 
  WHERE id = p_review_id AND business_id = p_business_id;
END;
$$;
