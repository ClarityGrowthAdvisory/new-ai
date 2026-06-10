
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Create user_roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Business profiles table
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  google_review_url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Positive reviews table
CREATE TABLE public.positive_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.positive_reviews ENABLE ROW LEVEL SECURITY;

-- Negative feedback table
CREATE TABLE public.negative_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 3),
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.negative_feedback ENABLE ROW LEVEL SECURITY;

-- Analytics table
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  five_star_clicks INTEGER NOT NULL DEFAULT 0,
  low_star_submissions INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Function to increment analytics
CREATE OR REPLACE FUNCTION public.increment_analytics(p_business_id UUID, p_column TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics (business_id, five_star_clicks, low_star_submissions)
  VALUES (p_business_id, 0, 0)
  ON CONFLICT (business_id) DO NOTHING;

  IF p_column = 'five_star_clicks' THEN
    UPDATE public.analytics SET five_star_clicks = five_star_clicks + 1 WHERE business_id = p_business_id;
  ELSIF p_column = 'low_star_submissions' THEN
    UPDATE public.analytics SET low_star_submissions = low_star_submissions + 1 WHERE business_id = p_business_id;
  END IF;
END;
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: admins see all, users see own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- business_profiles: owners manage own, admins see all, public can read by slug
CREATE POLICY "Owners can manage business profiles" ON public.business_profiles
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all business profiles" ON public.business_profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read business by slug" ON public.business_profiles
  FOR SELECT USING (true);

-- positive_reviews: business owners manage, public read
CREATE POLICY "Business owners manage reviews" ON public.positive_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_profiles bp WHERE bp.id = business_id AND bp.user_id = auth.uid())
  );
CREATE POLICY "Public can read reviews" ON public.positive_reviews
  FOR SELECT USING (true);

-- negative_feedback: anyone can insert, business owners read
CREATE POLICY "Anyone can submit feedback" ON public.negative_feedback
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Business owners can view feedback" ON public.negative_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_profiles bp WHERE bp.id = business_id AND bp.user_id = auth.uid())
  );
CREATE POLICY "Admins can view all feedback" ON public.negative_feedback
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- analytics: business owners read, public can trigger increment via function
CREATE POLICY "Business owners can view analytics" ON public.analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_profiles bp WHERE bp.id = business_id AND bp.user_id = auth.uid())
  );
CREATE POLICY "Admins can view all analytics" ON public.analytics
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
