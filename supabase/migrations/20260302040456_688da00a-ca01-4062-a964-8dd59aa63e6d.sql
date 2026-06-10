
-- Create reseller_limits table
CREATE TABLE IF NOT EXISTS public.reseller_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  client_limit integer NOT NULL DEFAULT 5,
  total_clients_created integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_limits ENABLE ROW LEVEL SECURITY;

-- RLS for reseller_limits
CREATE POLICY "Resellers can view own limits"
  ON public.reseller_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage reseller limits"
  ON public.reseller_limits FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- is_reseller helper
CREATE OR REPLACE FUNCTION public.is_reseller(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'reseller'
  )
$$;

-- Profiles: reseller access
CREATE POLICY "Resellers can view own and created profiles"
  ON public.profiles FOR SELECT
  USING (public.is_reseller(auth.uid()) AND (user_id = auth.uid() OR created_by = auth.uid()));

CREATE POLICY "Resellers can update own created profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_reseller(auth.uid()) AND (user_id = auth.uid() OR created_by = auth.uid()));

-- user_roles: reseller access
CREATE POLICY "Resellers can view their users roles"
  ON public.user_roles FOR SELECT
  USING (public.is_reseller(auth.uid()) AND (user_id = auth.uid() OR user_id IN (SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid())));

-- user_plans: reseller access
CREATE POLICY "Resellers can manage their users plans"
  ON public.user_plans FOR ALL
  USING (public.is_reseller(auth.uid()) AND user_id IN (SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()))
  WITH CHECK (public.is_reseller(auth.uid()) AND user_id IN (SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()));

-- business_profiles: reseller access
CREATE POLICY "Resellers can view their users business profiles"
  ON public.business_profiles FOR SELECT
  USING (public.is_reseller(auth.uid()) AND user_id IN (SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()));

-- analytics: reseller access
CREATE POLICY "Resellers can view their users analytics"
  ON public.analytics FOR SELECT
  USING (public.is_reseller(auth.uid()) AND business_id IN (SELECT bp.id FROM business_profiles bp JOIN profiles p ON p.user_id = bp.user_id WHERE p.created_by = auth.uid()));

-- negative_feedback: reseller access
CREATE POLICY "Resellers can view their users feedback"
  ON public.negative_feedback FOR SELECT
  USING (public.is_reseller(auth.uid()) AND business_id IN (SELECT bp.id FROM business_profiles bp JOIN profiles p ON p.user_id = bp.user_id WHERE p.created_by = auth.uid()));
