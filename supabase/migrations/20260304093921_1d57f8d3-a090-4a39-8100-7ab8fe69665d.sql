
-- Renewal requests table: resellers request renewal for their clients, super admin approves/rejects
CREATE TABLE public.renewal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'pending',
  message text NOT NULL DEFAULT '',
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;

-- Resellers can insert requests for their own clients
CREATE POLICY "Resellers can create renewal requests"
ON public.renewal_requests FOR INSERT
TO authenticated
WITH CHECK (
  is_reseller(auth.uid()) 
  AND reseller_id = auth.uid()
  AND client_user_id IN (
    SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()
  )
);

-- Resellers can view their own requests
CREATE POLICY "Resellers can view own renewal requests"
ON public.renewal_requests FOR SELECT
TO authenticated
USING (
  is_reseller(auth.uid()) AND reseller_id = auth.uid()
);

-- Super admins can manage all renewal requests
CREATE POLICY "Super admins can manage renewal requests"
ON public.renewal_requests FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));
