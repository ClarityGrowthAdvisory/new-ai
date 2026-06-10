
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Profiles RLS
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view own and created profiles" ON public.profiles
  FOR SELECT USING (
    is_admin(auth.uid()) AND (user_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Admins can update own created profiles" ON public.profiles
  FOR UPDATE USING (
    is_admin(auth.uid()) AND (user_id = auth.uid() OR created_by = auth.uid())
  );

-- User Roles RLS
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their users roles" ON public.user_roles
  FOR SELECT USING (
    is_admin(auth.uid()) AND (
      user_id = auth.uid() OR
      user_id IN (SELECT p.user_id FROM public.profiles p WHERE p.created_by = auth.uid())
    )
  );

-- User Plans RLS
DROP POLICY IF EXISTS "Admins can manage user plans" ON public.user_plans;

CREATE POLICY "Super admins can manage user plans" ON public.user_plans
  FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage their users plans" ON public.user_plans
  FOR ALL USING (
    is_admin(auth.uid()) AND
    user_id IN (SELECT p.user_id FROM public.profiles p WHERE p.created_by = auth.uid())
  ) WITH CHECK (
    is_admin(auth.uid()) AND
    user_id IN (SELECT p.user_id FROM public.profiles p WHERE p.created_by = auth.uid())
  );

-- Analytics RLS
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;

CREATE POLICY "Super admins can view all analytics" ON public.analytics
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their users analytics" ON public.analytics
  FOR SELECT USING (
    is_admin(auth.uid()) AND
    business_id IN (
      SELECT bp.id FROM public.business_profiles bp
      JOIN public.profiles p ON p.user_id = bp.user_id
      WHERE p.created_by = auth.uid()
    )
  );

-- Negative Feedback RLS
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.negative_feedback;

CREATE POLICY "Super admins can view all feedback" ON public.negative_feedback
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their users feedback" ON public.negative_feedback
  FOR SELECT USING (
    is_admin(auth.uid()) AND
    business_id IN (
      SELECT bp.id FROM public.business_profiles bp
      JOIN public.profiles p ON p.user_id = bp.user_id
      WHERE p.created_by = auth.uid()
    )
  );

-- Business Profiles RLS
DROP POLICY IF EXISTS "Admins can view all business profiles" ON public.business_profiles;

CREATE POLICY "Super admins can view all business profiles" ON public.business_profiles
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their users business profiles" ON public.business_profiles
  FOR SELECT USING (
    is_admin(auth.uid()) AND
    user_id IN (SELECT p.user_id FROM public.profiles p WHERE p.created_by = auth.uid())
  );

-- Plans RLS: only super_admin manages
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;

CREATE POLICY "Super admins can manage plans" ON public.plans
  FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

-- Payment Records RLS
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_records;

CREATE POLICY "Super admins can view all payments" ON public.payment_records
  FOR SELECT USING (is_super_admin(auth.uid()));

-- Promote existing admin to super_admin
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';

-- Update handle_new_user to include created_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone, created_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'created_by' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'created_by')::uuid
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;
