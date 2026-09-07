import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { format } from "date-fns";

export default function PlanGate({ children }: { children: ReactNode }) {
  const { loading, hasActivePlan, expiresAt } = usePlan();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (hasActivePlan) return <>{children}</>;

  const expired = !!expiresAt;

  return (
    <DashboardLayout>
      <Card className="mx-auto mt-10 max-w-lg shadow-card">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="rounded-full bg-muted p-4">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-xl font-bold">
            {expired ? "Your plan has expired" : "This section is locked"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {expired
              ? `Your subscription ended on ${format(expiresAt!, "dd/MM/yyyy")}. Renew your plan to unlock your review link and reviews again — your public link stays offline until then.`
              : "Purchase a subscription plan to create your review link, add positive review samples and go live."}
          </p>
          <Button asChild className="mt-2">
            <Link to="/dashboard/subscription">
              {expired ? "Renew Plan" : "View Plans"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
