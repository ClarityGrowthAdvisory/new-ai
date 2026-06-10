
-- Plans table for subscription management
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  badge text DEFAULT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  validity_days integer NOT NULL DEFAULT 30,
  max_reviews integer NOT NULL DEFAULT 50,
  max_segments integer NOT NULL DEFAULT 5,
  theme_access text[] NOT NULL DEFAULT ARRAY['default']::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with plans
CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Everyone can read active plans (for client selection)
CREATE POLICY "Anyone can read active plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (is_active = true);
