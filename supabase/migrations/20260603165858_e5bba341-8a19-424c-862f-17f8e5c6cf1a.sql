
-- Drop storage policies referencing removed roles / removed buckets
DROP POLICY IF EXISTS "Super admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete marketing materials" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can upload marketing materials" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update marketing materials" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can upload offer images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update offer images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete offer images" ON storage.objects;

-- 1. Drop unused tables (CASCADE removes their policies)
DROP TABLE IF EXISTS public.broadcast_reads CASCADE;
DROP TABLE IF EXISTS public.broadcast_messages CASCADE;
DROP TABLE IF EXISTS public.marketing_materials CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.renewal_requests CASCADE;
DROP TABLE IF EXISTS public.reseller_achievements CASCADE;
DROP TABLE IF EXISTS public.reseller_leads CASCADE;
DROP TABLE IF EXISTS public.reseller_limits CASCADE;
DROP TABLE IF EXISTS public.reseller_notifications CASCADE;
DROP TABLE IF EXISTS public.reseller_targets CASCADE;
DROP TABLE IF EXISTS public.reward_rules CASCADE;
DROP TABLE IF EXISTS public.slot_requests CASCADE;

-- 2. Drop reseller/super_admin policies on remaining public tables
DROP POLICY IF EXISTS "Resellers can view their users analytics" ON public.analytics;
DROP POLICY IF EXISTS "Super admins can view all analytics" ON public.analytics;

DROP POLICY IF EXISTS "Resellers can view their users business profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Super admins can view all business profiles" ON public.business_profiles;

DROP POLICY IF EXISTS "Resellers can view their users feedback" ON public.negative_feedback;
DROP POLICY IF EXISTS "Super admins can view all feedback" ON public.negative_feedback;

DROP POLICY IF EXISTS "Super admins can view all payments" ON public.payment_records;
CREATE POLICY "Admins can view all payments"
  ON public.payment_records FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Resellers can update own created profiles" ON public.profiles;
DROP POLICY IF EXISTS "Resellers can view own and created profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Resellers can activate plans for their users" ON public.user_plans;
DROP POLICY IF EXISTS "Resellers can view their users plans" ON public.user_plans;
DROP POLICY IF EXISTS "Super admins can manage user plans" ON public.user_plans;

DROP POLICY IF EXISTS "Resellers can view their users roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. Migrate role data: super_admin -> admin; drop reseller assignments
INSERT INTO public.user_roles (user_id, role)
  SELECT user_id, 'admin'::app_role
  FROM public.user_roles
  WHERE role = 'super_admin'
  ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles WHERE role IN ('super_admin', 'reseller');

-- 4. Drop helper functions no longer used
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.is_reseller(uuid);
DROP FUNCTION IF EXISTS public.user_has_plan(uuid);
