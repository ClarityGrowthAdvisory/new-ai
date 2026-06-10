
-- Step 1: Just add the new enum value and the created_by column
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT NULL;
