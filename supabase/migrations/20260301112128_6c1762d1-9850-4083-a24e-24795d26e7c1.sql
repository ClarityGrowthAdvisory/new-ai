
CREATE TABLE public.page_view_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.page_view_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public page)
CREATE POLICY "Anyone can insert page view logs" ON public.page_view_logs
  FOR INSERT WITH CHECK (true);

-- Allow business owners to read their own page view logs
CREATE POLICY "Business owners can read their page view logs" ON public.page_view_logs
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );
