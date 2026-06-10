CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles/roles for any existing auth users that are missing them
INSERT INTO public.profiles (user_id, name, email, phone)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'name', ''),
       u.email,
       COALESCE(u.raw_user_meta_data->>'phone', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'client'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;