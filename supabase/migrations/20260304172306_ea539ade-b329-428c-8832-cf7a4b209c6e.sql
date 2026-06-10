
-- Create a security definer function to check if user already has a plan
CREATE OR REPLACE FUNCTION public.user_has_plan(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_plans WHERE user_id = _user_id
  )
$$;

-- Drop the old recursive policy
DROP POLICY IF EXISTS "Resellers can activate plans for their users" ON public.user_plans;

-- Recreate without self-referencing query
CREATE POLICY "Resellers can activate plans for their users"
ON public.user_plans
FOR INSERT
TO authenticated
WITH CHECK (
  is_reseller(auth.uid())
  AND user_id IN (
    SELECT p.user_id FROM profiles p WHERE p.created_by = auth.uid()
  )
  AND NOT public.user_has_plan(user_id)
);
