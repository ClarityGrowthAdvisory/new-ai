
-- Reseller targets
CREATE TABLE public.reseller_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'revenue',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reseller_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers can manage own targets"
  ON public.reseller_targets FOR ALL TO authenticated
  USING (public.is_reseller(auth.uid()) AND reseller_id = auth.uid())
  WITH CHECK (public.is_reseller(auth.uid()) AND reseller_id = auth.uid());

CREATE POLICY "Super admins can view all targets"
  ON public.reseller_targets FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Reward rules (managed by super admin)
CREATE TABLE public.reward_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'client_count',
  target_value NUMERIC NOT NULL DEFAULT 0,
  badge_icon TEXT NOT NULL DEFAULT 'trophy',
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage reward rules"
  ON public.reward_rules FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Resellers can view active reward rules"
  ON public.reward_rules FOR SELECT TO authenticated
  USING (public.is_reseller(auth.uid()) AND is_active = true);

-- Reseller achievements
CREATE TABLE public.reseller_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL,
  reward_rule_id UUID NOT NULL REFERENCES public.reward_rules(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reseller_id, reward_rule_id)
);
ALTER TABLE public.reseller_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers can view own achievements"
  ON public.reseller_achievements FOR SELECT TO authenticated
  USING (public.is_reseller(auth.uid()) AND reseller_id = auth.uid());

CREATE POLICY "Resellers can insert own achievements"
  ON public.reseller_achievements FOR INSERT TO authenticated
  WITH CHECK (public.is_reseller(auth.uid()) AND reseller_id = auth.uid());

CREATE POLICY "Super admins can view all achievements"
  ON public.reseller_achievements FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Reseller notifications
CREATE TABLE public.reseller_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reseller_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers can manage own notifications"
  ON public.reseller_notifications FOR ALL TO authenticated
  USING (public.is_reseller(auth.uid()) AND reseller_id = auth.uid())
  WITH CHECK (public.is_reseller(auth.uid()) AND reseller_id = auth.uid());

CREATE POLICY "Super admins can manage all notifications"
  ON public.reseller_notifications FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
