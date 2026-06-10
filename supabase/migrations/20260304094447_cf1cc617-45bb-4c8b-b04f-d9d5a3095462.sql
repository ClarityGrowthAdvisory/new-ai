
ALTER TABLE public.reseller_limits ADD COLUMN allowed_plan_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.reseller_limits.allowed_plan_ids IS 'Plan IDs that this reseller is allowed to assign to clients. Empty means no plans allowed.';
