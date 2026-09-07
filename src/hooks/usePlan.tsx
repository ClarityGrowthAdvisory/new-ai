import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ActivePlanState {
  loading: boolean;
  hasActivePlan: boolean;
  expiresAt: Date | null;
  planName: string | null;
  refresh: () => void;
}

export function usePlan(): ActivePlanState {
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("user_plans")
      .select("expires_at, plan:plans(name)")
      .eq("user_id", user.id)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setExpiresAt(data?.expires_at ? new Date(data.expires_at) : null);
        setPlanName((data as any)?.plan?.name ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, tick]);

  const hasActivePlan =
    role === "admin" || (!!expiresAt && expiresAt.getTime() > Date.now());

  return {
    loading: authLoading || loading,
    hasActivePlan,
    expiresAt,
    planName,
    refresh: () => setTick((t) => t + 1),
  };
}
