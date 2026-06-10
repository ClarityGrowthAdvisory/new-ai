import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const { user } = useAuth();

  const [plans, setPlans] = useState<any[]>([]);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      )
    ) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);


  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {

        const [{ data: up, error: upError }, { data: pl, error: plError }] =
          await Promise.all([
            supabase
              .from("user_plans")
              .select("*, plan:plans(name, description)")
              .eq("user_id", user.id)
              .maybeSingle(),

            supabase
              .from("plans")
              .select("*")
              .eq("is_active", true)
              .order("price", { ascending: true }),
          ]);

        if (upError) console.error("User plan error:", upError);
        if (plError) console.error("Plans error:", plError);

        setUserPlan(up || null);
        setPlans(pl || []);

      } catch (err) {

        console.error("Subscription load error:", err);

      } finally {

        setLoading(false);

      }
    };

    loadData();

  }, [user]);

  const isExpired = userPlan
    ? new Date(userPlan.expires_at) < new Date()
    : true;

  const handlePayment = async (planId: string) => {
    if (!user || !scriptLoaded) return;


    setPaying(true);

    try {
      const res = await supabase.functions.invoke("razorpay", {
        body: {
          action: "create-order",
          plan_id: planId,
          is_renewal: false,
        },
      });

      if (res.error || !res.data?.order_id) {
        toast({
          title: "Error",
          description: "Failed to create order",
          variant: "destructive",
        });
        setPaying(false);
        return;
      }

      const { order_id, key_id } = res.data;

      const planPrice = plans.find((p) => p.id === planId)?.price ?? 0;

      const options = {
        key: key_id,
        amount: planPrice * 100,
        currency: "INR",
        name: "Review Growth",
        description: `Subscription - ₹${planPrice}`,
        order_id,

        handler: async (response: any) => {
          const verify = await supabase.functions.invoke("razorpay", {
            body: {
              action: "verify-payment",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verify.data?.success) {
            toast({
              title: "Payment Successful",
              description: "Your plan has been activated",
            });

            const { data } = await supabase
              .from("user_plans")
              .select("*, plan:plans(name, description)")
              .eq("user_id", user.id)
              .maybeSingle();

            setUserPlan(data);
          } else {
            toast({
              title: "Verification Failed",
              description: "Contact support",
              variant: "destructive",
            });
          }

          setPaying(false);
        },

        modal: {
          ondismiss: () => setPaying(false),
        },

        prefill: {
          email: user.email,
        },

        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
      setPaying(false);
    }

  };

  if (loading) {
    return (<DashboardLayout> <div className="flex justify-center items-center h-64"> <Loader2 className="h-8 w-8 animate-spin" /> </div> </DashboardLayout>
    );
  }

  return (<DashboardLayout> <div className="mb-8"> <h1 className="text-3xl font-bold">Subscription</h1> <p className="text-muted-foreground">
    Manage your plan and billing </p> </div>


    {/* Current Plan */}
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Current Plan</CardTitle>

        {userPlan && !isExpired ? (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> No Plan
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {userPlan ? (
          <>
            <p className="text-xl font-semibold">
              {userPlan.plan?.name || "Plan"}
            </p>

            <p className="flex items-center text-sm text-muted-foreground mt-2">
              <Calendar className="h-4 w-4 mr-2" />
              Expires {format(new Date(userPlan.expires_at), "dd MMM yyyy")}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            You don't have an active plan. Choose one below.
          </p>
        )}
      </CardContent>
    </Card>

    {/* Plans */}
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className="shadow-md">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {plan.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <span className="text-4xl font-bold">₹{plan.price}</span>
              <span className="text-muted-foreground"> /year</span>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {plan.max_segments} locations
              </li>

              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {plan.max_reviews} reviews
              </li>

              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {plan.theme_access?.length || 1} themes
              </li>
            </ul>

            <Button
              className="w-full"
              onClick={() => handlePayment(plan.id)}
              disabled={paying || !scriptLoaded}
            >
              {paying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Buy - ₹{plan.price}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </DashboardLayout>

  );
}
