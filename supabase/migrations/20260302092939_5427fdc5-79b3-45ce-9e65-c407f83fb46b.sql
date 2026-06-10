
CREATE TABLE public.slot_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL,
  requested_slots integer NOT NULL,
  current_limit integer NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.slot_requests ENABLE ROW LEVEL SECURITY;

-- Resellers can view their own requests
CREATE POLICY "Resellers can view own requests"
ON public.slot_requests FOR SELECT
TO authenticated
USING (is_reseller(auth.uid()) AND reseller_id = auth.uid());

-- Resellers can insert their own requests
CREATE POLICY "Resellers can insert own requests"
ON public.slot_requests FOR INSERT
TO authenticated
WITH CHECK (is_reseller(auth.uid()) AND reseller_id = auth.uid());

-- Super admins can manage all requests
CREATE POLICY "Super admins can manage slot requests"
ON public.slot_requests FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));
