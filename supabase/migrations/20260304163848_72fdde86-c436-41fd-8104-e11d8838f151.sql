
CREATE TABLE public.reseller_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  business_type TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reseller_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers can manage own leads"
  ON public.reseller_leads FOR ALL TO authenticated
  USING (public.is_reseller(auth.uid()) AND reseller_id = auth.uid())
  WITH CHECK (public.is_reseller(auth.uid()) AND reseller_id = auth.uid());

CREATE POLICY "Super admins can view all leads"
  ON public.reseller_leads FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
