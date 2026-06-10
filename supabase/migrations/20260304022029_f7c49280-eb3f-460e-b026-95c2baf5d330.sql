
-- Remove the RLS policy that allows resellers to manage user_plans
DROP POLICY IF EXISTS "Resellers can manage their users plans" ON public.user_plans;

-- Add a read-only policy so resellers can still VIEW their clients' plans
CREATE POLICY "Resellers can view their users plans"
ON public.user_plans
FOR SELECT
USING (
  is_reseller(auth.uid()) AND user_id IN (
    SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()
  )
);
