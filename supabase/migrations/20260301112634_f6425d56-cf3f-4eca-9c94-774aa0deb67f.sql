
-- Add logo_url column to business_profiles
ALTER TABLE public.business_profiles ADD COLUMN logo_url text;

-- Create storage bucket for business logos
INSERT INTO storage.buckets (id, name, public) VALUES ('business-logos', 'business-logos', true);

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-logos');

-- Allow authenticated users to update their logos
CREATE POLICY "Users can update logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'business-logos');

-- Allow authenticated users to delete their logos
CREATE POLICY "Users can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'business-logos');

-- Allow public read access to logos
CREATE POLICY "Public can read logos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'business-logos');
