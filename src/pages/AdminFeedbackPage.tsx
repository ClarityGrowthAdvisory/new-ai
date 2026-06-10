import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  rating: number;
  feedback_text: string;
  created_at: string;
  business_name: string;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: fb } = await supabase.from("negative_feedback").select("*, business_profiles(business_name)").order("created_at", { ascending: false });
      const items: FeedbackItem[] = (fb || []).map((f: any) => ({
        id: f.id,
        rating: f.rating,
        feedback_text: f.feedback_text,
        created_at: f.created_at,
        business_name: f.business_profiles?.business_name || "Unknown",
      }));
      setFeedback(items);
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">All Feedback</h1>
        <p className="text-sm text-muted-foreground">Negative feedback across all businesses</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {feedback.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No feedback yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead className="w-40">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.business_name}</TableCell>
                    <TableCell>{"⭐".repeat(f.rating)}</TableCell>
                    <TableCell className="max-w-md">{f.feedback_text}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(f.created_at), "MMM d, yyyy")}</TableCell>
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
