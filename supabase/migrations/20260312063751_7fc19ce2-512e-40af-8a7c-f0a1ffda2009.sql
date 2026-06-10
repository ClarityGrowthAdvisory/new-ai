
-- Update profiles: Admins can view ALL profiles
DROP POLICY IF EXISTS "Admins can view own and created profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- Update profiles: Admins can update ALL profiles
DROP POLICY IF EXISTS "Admins can update own created profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Update user_roles: Admins can view ALL roles
DROP POLICY IF EXISTS "Admins can view their users roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (is_admin(auth.uid()));

-- Update business_profiles: Admins can view ALL business profiles
DROP POLICY IF EXISTS "Admins can view their users business profiles" ON public.business_profiles;
CREATE POLICY "Admins can view all business profiles"
  ON public.business_profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- Update analytics: Admins can view ALL analytics
DROP POLICY IF EXISTS "Admins can view their users analytics" ON public.analytics;
CREATE POLICY "Admins can view all analytics"
  ON public.analytics FOR SELECT
  USING (is_admin(auth.uid()));

-- Update negative_feedback: Admins can view ALL feedback
DROP POLICY IF EXISTS "Admins can view their users feedback" ON public.negative_feedback;
CREATE POLICY "Admins can view all feedback"
  ON public.negative_feedback FOR SELECT
  USING (is_admin(auth.uid()));

-- Update user_plans: Admins can manage ALL user plans
DROP POLICY IF EXISTS "Admins can manage their users plans" ON public.user_plans;
CREATE POLICY "Admins can manage all user plans"
  ON public.user_plans FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
