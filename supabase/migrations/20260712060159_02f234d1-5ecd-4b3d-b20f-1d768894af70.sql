
-- Drop broad SELECT policies that allow listing entire public buckets.
-- Files remain accessible via their direct public URLs (public buckets bypass RLS for URL fetches).
DROP POLICY IF EXISTS "Public can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view offer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read marketing materials" ON storage.objects;

-- Re-add a narrow read policy for marketing-materials so authenticated users can list/read within an admin-uploaded bucket
CREATE POLICY "Authenticated users can read marketing materials"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'marketing-materials');
