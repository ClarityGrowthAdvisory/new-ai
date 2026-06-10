
CREATE POLICY "Admins can view marketing materials"
  ON public.marketing_materials FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
