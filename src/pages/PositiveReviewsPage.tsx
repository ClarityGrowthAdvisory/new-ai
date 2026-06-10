import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, X, Check, Upload, Tag, MessageSquare } from "lucide-react";

interface Segment {
  id: string;
  name: string;
}

interface Review {
  id: string;
  review_text: string;
  segment_id: string | null;
}

export default function PositiveReviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [maxReviews, setMaxReviews] = useState<number | null>(null);
  const [newReview, setNewReview] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("all");
  const [addSegmentId, setAddSegmentId] = useState<string>("none");
  const [bulkSegmentId, setBulkSegmentId] = useState<string>("none");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: bp } = await supabase.from("business_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!bp) return;
      setBusinessId(bp.id);

      const [{ data: revs }, { data: segs }, { data: userPlan }] = await Promise.all([
        supabase.from("positive_reviews").select("id, review_text, segment_id").eq("business_id", bp.id).order("created_at", { ascending: false }),
        supabase.from("review_segments").select("id, name").eq("business_id", bp.id).order("name"),
        supabase.from("user_plans").select("plan_id").eq("user_id", user.id).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setReviews(revs || []);
      setSegments(segs || []);

      if (userPlan?.plan_id) {
        const { data: plan } = await supabase.from("plans").select("max_reviews").eq("id", userPlan.plan_id).maybeSingle();
        if (plan) setMaxReviews(plan.max_reviews);
      }
    };
    load();
  }, [user]);

  const addSegment = async () => {
    if (!businessId || !newSegmentName.trim()) return;
    const { data, error } = await supabase
      .from("review_segments")
      .insert({ business_id: businessId, name: newSegmentName.trim() })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSegments([...segments, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSegmentName("");
      toast({ title: "Segment added!" });
    }
  };

  const deleteSegment = async (id: string) => {
    await supabase.from("review_segments").delete().eq("id", id);
    setSegments(segments.filter((s) => s.id !== id));
    // Reviews with this segment will have segment_id set to null (ON DELETE SET NULL)
    setReviews(reviews.map((r) => r.segment_id === id ? { ...r, segment_id: null } : r));
    toast({ title: "Segment deleted" });
  };

  const addReview = async () => {
    if (!businessId || !newReview.trim()) return;
    setAdding(true);
    const segId = addSegmentId === "none" ? null : addSegmentId;
    const { data, error } = await supabase
      .from("positive_reviews")
      .insert({ business_id: businessId, review_text: newReview.trim(), segment_id: segId })
      .select("id, review_text, segment_id")
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReviews([data, ...reviews]);
      setNewReview("");
      toast({ title: "Added!" });
    }
    setAdding(false);
  };

  const bulkAddReviews = async () => {
    if (!businessId || !bulkText.trim()) return;
    setBulkAdding(true);
    const segId = bulkSegmentId === "none" ? null : bulkSegmentId;

    const lines = bulkText
      .split(/\n/)
      .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast({ title: "Nothing to add", description: "Couldn't detect any reviews.", variant: "destructive" });
      setBulkAdding(false);
      return;
    }

    const rows = lines.map((text) => ({ business_id: businessId, review_text: text, segment_id: segId }));

    const batchSize = 50;
    const inserted: Review[] = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { data, error } = await supabase.from("positive_reviews").insert(batch).select("id, review_text, segment_id");
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        break;
      }
      if (data) inserted.push(...data);
    }

    if (inserted.length > 0) {
      setReviews([...inserted.reverse(), ...reviews]);
      setBulkText("");
      toast({ title: `Added ${inserted.length} reviews!` });
    }
    setBulkAdding(false);
  };

  const deleteReview = async (id: string) => {
    await supabase.from("positive_reviews").delete().eq("id", id);
    setReviews(reviews.filter((r) => r.id !== id));
    toast({ title: "Deleted" });
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from("positive_reviews").update({ review_text: editText.trim() }).eq("id", id);
    if (!error) {
      setReviews(reviews.map((r) => (r.id === id ? { ...r, review_text: editText.trim() } : r)));
      setEditingId(null);
      toast({ title: "Updated!" });
    }
  };

  const previewCount = bulkText.trim()
    ? bulkText.split(/\n/).map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim()).filter((l) => l.length > 0).length
    : 0;

  const getSegmentName = (segId: string | null) => segments.find((s) => s.id === segId)?.name;

  const filteredReviews = selectedSegmentId === "all"
    ? reviews
    : selectedSegmentId === "none"
      ? reviews.filter((r) => !r.segment_id)
      : reviews.filter((r) => r.segment_id === selectedSegmentId);

  const SegmentPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select segment" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No segment</SelectItem>
        {segments.map((s) => (
          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Positive Reviews</h1>
        <p className="text-sm text-muted-foreground">Manage sample reviews shown to happy customers</p>
      </div>

      {/* Remaining Reviews Card */}
      {businessId && (
        <Card className="shadow-card mb-6 border-0 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Reviews Remaining</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-heading text-primary">
                    {maxReviews !== null ? Math.max(0, maxReviews - reviews.length) : reviews.length}
                  </span>
                  {maxReviews !== null ? (
                    <span className="text-sm text-muted-foreground">of {maxReviews} total</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">reviews added (no plan limit)</span>
                  )}
                </div>
                {maxReviews !== null && (
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, (reviews.length / maxReviews) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <Badge variant={maxReviews !== null && reviews.length >= maxReviews ? "destructive" : "secondary"} className="text-xs">
                {reviews.length} used
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {!businessId ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            Please set up your review link first.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Segments Manager */}
          <Card className="shadow-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Tag className="h-4 w-4" /> Review Segments
              </CardTitle>
              <CardDescription>Create categories like Food, Service, Quality. Customers can optionally filter by segment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {segments.map((seg) => (
                  <Badge key={seg.id} variant="secondary" className="gap-1 text-sm py-1 px-3">
                    {seg.name}
                    <button onClick={() => deleteSegment(seg.id)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {segments.length === 0 && <p className="text-sm text-muted-foreground">No segments yet.</p>}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSegmentName}
                  onChange={(e) => setNewSegmentName(e.target.value)}
                  placeholder="e.g. Food, Service, Quality"
                  className="max-w-xs"
                  onKeyDown={(e) => e.key === "Enter" && addSegment()}
                />
                <Button onClick={addSegment} disabled={!newSegmentName.trim()} size="sm" className="gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Reviews */}
          <Card className="shadow-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Add Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="single">
                <TabsList className="mb-4">
                  <TabsTrigger value="single">Single</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="space-y-3">
                  {segments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Segment:</span>
                      <SegmentPicker value={addSegmentId} onChange={setAddSegmentId} />
                    </div>
                  )}
                  <Textarea value={newReview} onChange={(e) => setNewReview(e.target.value)} placeholder="Write a sample positive review..." rows={3} maxLength={500} />
                  <Button onClick={addReview} disabled={adding || !newReview.trim()} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Review
                  </Button>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-3">
                  <CardDescription className="text-xs">
                    Paste multiple reviews — <strong>one review per line</strong>. Each line becomes a separate review.
                  </CardDescription>
                  {segments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Segment:</span>
                      <SegmentPicker value={bulkSegmentId} onChange={setBulkSegmentId} />
                    </div>
                  )}
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`Great service and friendly staff!\nAmazing experience, highly recommend!\nBest place in town, will come back!`}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  {previewCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Detected <strong className="text-foreground">{previewCount}</strong> review{previewCount !== 1 ? "s" : ""}
                    </p>
                  )}
                  <Button onClick={bulkAddReviews} disabled={bulkAdding || previewCount === 0} className="gap-2">
                    <Upload className="h-4 w-4" /> {bulkAdding ? "Importing..." : `Import ${previewCount} Review${previewCount !== 1 ? "s" : ""}`}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Filter & Review List */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Reviews</h2>
            <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All segments</SelectItem>
                <SelectItem value="none">Uncategorized</SelectItem>
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="shadow-card animate-fade-in">
                <CardContent className="p-4">
                  {editingId === review.id ? (
                    <div className="space-y-2">
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} maxLength={500} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(review.id)} className="gap-1"><Check className="h-3 w-3" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="gap-1"><X className="h-3 w-3" /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {review.segment_id && (
                          <Badge variant="outline" className="mb-1 text-xs">{getSegmentName(review.segment_id)}</Badge>
                        )}
                        <p className="text-sm leading-relaxed">{review.review_text}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(review.id); setEditText(review.review_text); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteReview(review.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredReviews.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No reviews in this segment.</p>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
