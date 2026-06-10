import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface Feedback {
  id: string;
  rating: number;
  feedback_text: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export default function NegativeFeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: bp } = await supabase.from("business_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!bp) return;
      const { data } = await supabase.from("negative_feedback").select("*").eq("business_id", bp.id).order("created_at", { ascending: false });
      setFeedback(data || []);
    };
    load();
  }, [user]);

  const starDisplay = (rating: number) => "⭐".repeat(rating);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Negative Feedback</h1>
        <p className="text-sm text-muted-foreground">Customer feedback from low ratings</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {feedback.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No feedback yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rating</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead className="w-40">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{starDisplay(f.rating)}</TableCell>
                    <TableCell>{f.customer_name || "-"}</TableCell>
                    <TableCell>{f.customer_phone || "-"}</TableCell>
                    <TableCell className="max-w-md">{f.feedback_text}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(f.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
