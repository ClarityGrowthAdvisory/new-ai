
-- 1. Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_copied_review(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_copied_review(uuid, uuid) TO authenticated;

-- Public-facing RPCs: explicit grants to anon+authenticated only
REVOKE EXECUTE ON FUNCTION public.get_public_business(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_reviews(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_segments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_segments(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_negative_feedback(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_negative_feedback(uuid, integer, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_negative_feedback(uuid, integer, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_negative_feedback(uuid, integer, text, text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_analytics(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_analytics(uuid, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.log_page_view(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_page_view(uuid, text, text, text, text, text) TO anon, authenticated;

-- 2. business_profiles: drop overly-broad public policy (public access now only via get_public_business RPC)
DROP POLICY IF EXISTS "Public can read business by slug" ON public.business_profiles;

-- 3. marketing-materials bucket: explicit admin-only write policies
CREATE POLICY "Admins can upload marketing materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'marketing-materials' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update marketing materials"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'marketing-materials' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'marketing-materials' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete marketing materials"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'marketing-materials' AND public.is_admin(auth.uid()));

-- 4. payment_settings: prevent client from reading razorpay_key_secret
DROP POLICY IF EXISTS "Admins can view payment settings" ON public.payment_settings;

-- Allow admins to see only non-secret fields
CREATE POLICY "Admins can view payment settings (non-secret)"
ON public.payment_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Revoke column-level SELECT on the secret from client roles
REVOKE SELECT (razorpay_key_secret) ON public.payment_settings FROM authenticated, anon;

-- 5. negative_feedback: explicit restrictive INSERT policy (only via submit_negative_feedback RPC which is SECURITY DEFINER)
CREATE POLICY "Block direct inserts on negative_feedback"
ON public.negative_feedback AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (false);

-- 6. positive_reviews & review_segments: explicit (denied) public SELECT policy documents intent; public access is via SECURITY DEFINER RPCs get_public_reviews / get_public_segments only.
-- (No permissive public SELECT is added on purpose — RPCs bypass RLS safely.)
COMMENT ON FUNCTION public.get_public_reviews(uuid) IS 'Public accessor for positive_reviews; safe SECURITY DEFINER wrapper.';
COMMENT ON FUNCTION public.get_public_segments(uuid) IS 'Public accessor for review_segments; safe SECURITY DEFINER wrapper.';
