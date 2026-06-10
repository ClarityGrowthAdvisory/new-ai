
-- Drop the SELECT-only policy we just created
DROP POLICY IF EXISTS "Resellers can view their users plans" ON public.user_plans;

-- Resellers can VIEW their clients' plans
CREATE POLICY "Resellers can view their users plans"
ON public.user_plans
FOR SELECT
USING (
  is_reseller(auth.uid()) AND user_id IN (
    SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()
  )
);

-- Resellers can INSERT (initial activation) ONLY if the client has NO existing plan
CREATE POLICY "Resellers can activate plans for their users"
ON public.user_plans
FOR INSERT
WITH CHECK (
  is_reseller(auth.uid()) 
  AND user_id IN (
    SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.user_plans up WHERE up.user_id = user_plans.user_id
  )
);
