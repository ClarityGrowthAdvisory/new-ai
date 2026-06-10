
-- ============================================================
-- FIX 1: Storage - restrict business-logos to owner paths
-- ============================================================
DROP POLICY IF EXISTS "Users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logos" ON storage.objects;

CREATE POLICY "Users can upload own logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- FIX 2: Analytics RPC - add ownership validation
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_analytics(p_business_id uuid, p_column text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Validate column name to prevent injection
  IF p_column NOT IN ('five_star_clicks', 'low_star_submissions', 'page_views') THEN
    RAISE EXCEPTION 'Invalid column name';
  END IF;

  -- For non-page_views columns, require authentication and business ownership
  IF p_column != 'page_views' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.business_profiles 
      WHERE id = p_business_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Not authorized to modify analytics for this business';
    END IF;
  END IF;

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
$$;

-- ============================================================
-- FIX 3: Payment records - remove user INSERT/UPDATE policies
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment_records;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payment_records;

-- ============================================================
-- FIX 4: Positive reviews - remove public DELETE, restrict to owners
-- ============================================================
DROP POLICY IF EXISTS "Public can delete reviews" ON public.positive_reviews;

CREATE POLICY "Business owners can delete reviews" ON public.positive_reviews
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = positive_reviews.business_id AND bp.user_id = auth.uid()
    )
  );
