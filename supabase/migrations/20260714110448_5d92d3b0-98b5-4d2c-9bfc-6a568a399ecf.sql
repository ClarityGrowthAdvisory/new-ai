DROP POLICY IF EXISTS "Users can upload own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own business logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view business logos" ON storage.objects;

CREATE POLICY "Users can upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own business logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view business logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND public.is_admin(auth.uid())
);