
-- Create marketing_materials table
CREATE TABLE public.marketing_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  file_size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.marketing_materials ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage marketing materials"
  ON public.marketing_materials FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Resellers can view all materials
CREATE POLICY "Resellers can view marketing materials"
  ON public.marketing_materials FOR SELECT
  TO authenticated
  USING (public.is_reseller(auth.uid()));

-- Create storage bucket for marketing materials
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-materials', 'marketing-materials', true);

-- Storage policies: super admins can upload/delete
CREATE POLICY "Super admins can upload marketing materials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketing-materials' AND public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update marketing materials"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'marketing-materials' AND public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete marketing materials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'marketing-materials' AND public.is_super_admin(auth.uid()));

-- Anyone authenticated can read/download
CREATE POLICY "Authenticated users can read marketing materials"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'marketing-materials');
