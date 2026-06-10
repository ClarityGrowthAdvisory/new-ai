import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";

export default function PlanExpiryAlert() {
  const { user, role } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!user || role !== "client") return;
    supabase
      .from("user_plans")
      .select("expires_at")
      .eq("user_id", user.id)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.expires_at) {
          const diff = differenceInDays(new Date(data.expires_at), new Date());
          if (diff <= 30) setDaysLeft(diff);
        }
      });
  }, [user, role]);

  if (daysLeft === null) return null;

  const isUrgent = daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  return (
    <Alert
      className={
        isExpired
          ? "border-destructive bg-destructive/10 mb-6"
          : isUrgent
          ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20 mb-6"
          : "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 mb-6"
      }
    >
      {isExpired ? (
        <AlertTriangle className="h-4 w-4 text-destructive" />
      ) : (
        <Clock className={isUrgent ? "h-4 w-4 text-orange-500" : "h-4 w-4 text-yellow-600"} />
      )}
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-medium">
          {isExpired
            ? "Your plan has expired! Your public review page is disabled."
            : `Your plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Renew now to avoid interruption.`}
        </span>
        <Link
          to="/dashboard/subscription"
          className="text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {isExpired ? "Renew Now" : "View Subscription"}
        </Link>
      </AlertDescription>
    </Alert>
  );
}
