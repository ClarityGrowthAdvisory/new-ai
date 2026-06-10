import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ThumbsDown, FileText, Eye, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import PlanExpiryAlert from "@/components/PlanExpiryAlert";

interface FeedbackEntry {
  created_at: string;
}

interface PageViewLog {
  viewed_at: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display}</>;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ links: 0, positive: 0, negative: 0, totalReviews: 0, pageViews: 0 });
  const [positiveData, setPositiveData] = useState<FeedbackEntry[]>([]);
  const [negativeData, setNegativeData] = useState<FeedbackEntry[]>([]);
  const [pageViewLogs, setPageViewLogs] = useState<PageViewLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: bps } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", user.id);
      const businessIds = bps?.map((b) => b.id) || [];

      let positive = 0;
      let negative = 0;
      let totalReviews = 0;
      let pageViews = 0;
      if (businessIds.length > 0) {
        const [{ data: analytics }, { count: reviewCount }, { data: posReviews }, { data: negFeedback }, { data: viewLogs }] = await Promise.all([
          supabase.from("analytics").select("five_star_clicks, low_star_submissions, page_views").in("business_id", businessIds),
          supabase.from("positive_reviews").select("id", { count: "exact", head: true }).in("business_id", businessIds),
          supabase.from("positive_reviews").select("created_at").in("business_id", businessIds).gte("created_at", subDays(new Date(), 30).toISOString()),
          supabase.from("negative_feedback").select("created_at").in("business_id", businessIds).gte("created_at", subDays(new Date(), 30).toISOString()),
          supabase.from("page_view_logs").select("viewed_at").in("business_id", businessIds).gte("viewed_at", subDays(new Date(), 30).toISOString()),
        ]);
        analytics?.forEach((a) => {
          positive += a.five_star_clicks;
          negative += a.low_star_submissions;
          pageViews += (a as any).page_views || 0;
        });
        totalReviews = reviewCount || 0;
        setPositiveData(posReviews || []);
        setNegativeData(negFeedback || []);
        setPageViewLogs(viewLogs || []);
      }
      setStats({ links: businessIds.length, positive, negative, totalReviews, pageViews });
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const chartData = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const map = new Map<string, { positive: number; negative: number; visitors: number }>();
    days.forEach((d) => map.set(format(d, "yyyy-MM-dd"), { positive: 0, negative: 0, visitors: 0 }));

    positiveData.forEach((r) => {
      const key = format(startOfDay(new Date(r.created_at)), "yyyy-MM-dd");
      const entry = map.get(key);
      if (entry) entry.positive++;
    });
    negativeData.forEach((r) => {
      const key = format(startOfDay(new Date(r.created_at)), "yyyy-MM-dd");
      const entry = map.get(key);
      if (entry) entry.negative++;
    });
    pageViewLogs.forEach((r) => {
      const key = format(startOfDay(new Date(r.viewed_at)), "yyyy-MM-dd");
      const entry = map.get(key);
      if (entry) entry.visitors++;
    });

    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const val = map.get(key)!;
      return { date: format(d, "MMM d"), ...val };
    });
  }, [positiveData, negativeData, pageViewLogs]);

  // Calculate today's stats for hero
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayVisitors = pageViewLogs.filter(l => format(startOfDay(new Date(l.viewed_at)), "yyyy-MM-dd") === todayKey).length;

  const cards = [
    { title: "Total Reviews", value: stats.totalReviews, icon: FileText, gradient: "gradient-primary", trend: "+12%" },
    { title: "Page Visitors", value: stats.pageViews, icon: Eye, gradient: "gradient-success", trend: "+8%" },
    { title: "Private Feedback", value: stats.negative, icon: ThumbsDown, gradient: "bg-destructive", trend: null },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-32 rounded-2xl skeleton-shimmer" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton-shimmer" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PlanExpiryAlert />

      {/* Hero Welcome Section */}
      <Card className="mb-8 overflow-hidden border-0 shadow-card">
        <div className="relative p-8 lg:p-10">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Review Growth Dashboard</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              Welcome back 👋
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-lg">
              {todayVisitors > 0 ? (
                <>Today <span className="font-semibold text-foreground">{todayVisitors}</span> customer{todayVisitors !== 1 ? "s" : ""} visited your review page.
                {stats.positive > 0 && <> Total <span className="font-semibold text-foreground">{stats.positive}</span> redirected to Google ⭐</>}
                </>
              ) : (
                "Your review dashboard is ready. Share your link to start collecting reviews."
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card
            key={card.title}
            className="group border-0 shadow-card hover-lift cursor-default"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.gradient} text-white shadow-lg`}>
                  <card.icon className="h-5 w-5" />
                </div>
                {card.trend && (
                  <div className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    <TrendingUp className="h-3 w-3" />
                    {card.trend}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold font-heading tracking-tight">
                <AnimatedNumber value={card.value} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 mt-8 lg:grid-cols-2">
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Daily Visitors</CardTitle>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-card-hover)" }} />
                <Area type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#visitGrad)" name="Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
