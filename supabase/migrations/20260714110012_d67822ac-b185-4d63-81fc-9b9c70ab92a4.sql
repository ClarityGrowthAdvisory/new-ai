
CREATE POLICY "Admins can upload business logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-logos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update business logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-logos' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'business-logos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete business logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-logos' AND public.is_admin(auth.uid()));
