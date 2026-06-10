
-- Broadcast messages from super admin
CREATE TABLE public.broadcast_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID NOT NULL
);
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage broadcasts"
  ON public.broadcast_messages FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their broadcasts"
  ON public.broadcast_messages FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) AND (target_role = 'admin' OR target_role = 'all'));

CREATE POLICY "Resellers can view their broadcasts"
  ON public.broadcast_messages FOR SELECT TO authenticated
  USING (public.is_reseller(auth.uid()) AND (target_role = 'reseller' OR target_role = 'all'));

-- Track read status per user
CREATE TABLE public.broadcast_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES public.broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);
ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reads"
  ON public.broadcast_reads FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all reads"
  ON public.broadcast_reads FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
