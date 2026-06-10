
-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all offers
CREATE POLICY "Super admins can manage offers"
  ON public.offers FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Resellers can view active offers within validity
CREATE POLICY "Resellers can view active offers"
  ON public.offers FOR SELECT TO authenticated
  USING (is_reseller(auth.uid()) AND is_active = true AND valid_from <= CURRENT_DATE AND valid_until >= CURRENT_DATE);

-- Admins can view active offers within validity
CREATE POLICY "Admins can view active offers"
  ON public.offers FOR SELECT TO authenticated
  USING (is_admin(auth.uid()) AND is_active = true AND valid_from <= CURRENT_DATE AND valid_until >= CURRENT_DATE);

-- Create storage bucket for offer images
INSERT INTO storage.buckets (id, name, public) VALUES ('offer-images', 'offer-images', true);

-- Storage policies for offer images
CREATE POLICY "Super admins can upload offer images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'offer-images' AND is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update offer images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'offer-images' AND is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete offer images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'offer-images' AND is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view offer images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'offer-images');
