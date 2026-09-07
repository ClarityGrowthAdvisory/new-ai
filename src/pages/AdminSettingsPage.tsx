import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [form, setForm] = useState({
    razorpay_key_id: "",
    razorpay_key_secret: "",
    is_active: true,
  });

  useEffect(() => {
    (async () => {
      // Note: razorpay_key_secret is intentionally not selected — it is write-only
      // from the client. The secret is only readable by the backend service role.
      const { data } = await supabase
        .from("payment_settings")
        .select("id, razorpay_key_id, is_active, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setRowId(data.id);
        setForm({
          razorpay_key_id: data.razorpay_key_id || "",
          razorpay_key_secret: "",
          is_active: data.is_active,
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!form.razorpay_key_id.trim()) {
      toast({ title: "Key ID is required", variant: "destructive" });
      return;
    }
    if (!rowId && !form.razorpay_key_secret.trim()) {
      toast({ title: "Key Secret is required on first save", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      razorpay_key_id: form.razorpay_key_id.trim(),
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    };
    // Only send secret when user typed a new one (blank = keep existing)
    if (form.razorpay_key_secret.trim()) {
      payload.razorpay_key_secret = form.razorpay_key_secret.trim();
    }
    let error;
    if (rowId) {
      ({ error } = await supabase.from("payment_settings").update(payload).eq("id", rowId));
    } else {
      const res = await supabase.from("payment_settings").insert(payload).select("id").single();
      error = res.error;
      if (res.data) setRowId(res.data.id);
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Razorpay settings saved!" });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your Razorpay credentials. Clients will use these keys for checkout.
        </p>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Razorpay Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Razorpay Key ID</Label>
            <Input
              placeholder="rzp_test_... or rzp_live_..."
              value={form.razorpay_key_id}
              onChange={(e) => setForm({ ...form, razorpay_key_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Razorpay Key Secret</Label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                placeholder={rowId ? "Leave blank to keep existing secret" : "Your Razorpay Key Secret"}
                value={form.razorpay_key_secret}
                onChange={(e) => setForm({ ...form, razorpay_key_secret: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find these at dashboard.razorpay.com → Settings → API Keys
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Payments Active</p>
              <p className="text-xs text-muted-foreground">
                Disable to temporarily stop accepting payments
              </p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>

          <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
