
-- 1. Fix existing user: assign client role to suvagiaparth2002@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('3582d24e-2025-40ef-9f94-a8e20a046d55', 'client')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Update handle_new_user trigger to auto-assign 'client' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone, created_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'created_by' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'created_by')::uuid
      ELSE NULL
    END
  );

  -- Auto-assign client role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
