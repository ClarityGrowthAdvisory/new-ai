import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MousePointerClick, QrCode, Smartphone, Monitor, Tablet, Globe2, Download, Link2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

interface PageViewLog {
  business_id: string;
  viewed_at: string;
  device_type: string | null;
  country: string | null;
  city: string | null;
  source: string | null;
}

interface Business {
  id: string;
  business_name: string;
  slug: string;
}

interface AnalyticsRow {
  business_id: string;
  five_star_clicks: number;
  low_star_submissions: number;
  page_views: number;
}

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function csvEscape(v: any) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [logs, setLogs] = useState<PageViewLog[]>([]);
  const [days, setDays] = useState(30);
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: bps } = await supabase
        .from("business_profiles")
        .select("id, business_name, slug")
        .eq("user_id", user.id);
      const list = (bps || []) as Business[];
      setBusinesses(list);
      const ids = list.map((b) => b.id);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      const [{ data: an }, { data: lg }] = await Promise.all([
        supabase
          .from("analytics")
          .select("business_id, five_star_clicks, low_star_submissions, page_views")
          .in("business_id", ids),
        supabase
          .from("page_view_logs")
          .select("business_id, viewed_at, device_type, country, city, source")
          .in("business_id", ids)
          .gte("viewed_at", subDays(new Date(), days).toISOString())
          .order("viewed_at", { ascending: false })
          .limit(5000),
      ]);
      setAnalytics((an || []) as AnalyticsRow[]);
      setLogs((lg || []) as PageViewLog[]);
      setLoading(false);
    })();
  }, [user, days]);

  const filteredLogs = useMemo(
    () => (businessFilter === "all" ? logs : logs.filter((l) => l.business_id === businessFilter)),
    [logs, businessFilter]
  );

  const filteredAnalytics = useMemo(
    () => (businessFilter === "all" ? analytics : analytics.filter((a) => a.business_id === businessFilter)),
    [analytics, businessFilter]
  );

  const totals = useMemo(() => {
    let views = 0, clicks = 0, lowStar = 0;
    filteredAnalytics.forEach((a) => {
      views += a.page_views || 0;
      clicks += a.five_star_clicks || 0;
      lowStar += a.low_star_submissions || 0;
    });
    const qrScans = filteredLogs.filter((l) => l.source === "qr").length;
    return { views, clicks, lowStar, qrScans };
  }, [filteredAnalytics, filteredLogs]);

  const dailyData = useMemo(() => {
    const range = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
    const map = new Map<string, { date: string; views: number; qr: number; link: number }>();
    range.forEach((d) => {
      const k = format(d, "yyyy-MM-dd");
      map.set(k, { date: format(d, "MMM d"), views: 0, qr: 0, link: 0 });
    });
    filteredLogs.forEach((l) => {
      const k = format(startOfDay(new Date(l.viewed_at)), "yyyy-MM-dd");
      const e = map.get(k);
      if (!e) return;
      e.views++;
      if (l.source === "qr") e.qr++;
      else e.link++;
    });
    return Array.from(map.values());
  }, [filteredLogs, days]);

  const hourlyData = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, visits: 0 }));
    filteredLogs.forEach((l) => {
      const h = new Date(l.viewed_at).getHours();
      arr[h].visits++;
    });
    return arr;
  }, [filteredLogs]);

  const deviceData = useMemo(() => {
    const counts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
    filteredLogs.forEach((l) => {
      const k = l.device_type || "unknown";
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name[0].toUpperCase() + name.slice(1), value }));
  }, [filteredLogs]);

  const geoData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredLogs.forEach((l) => {
      const k = l.country || "Unknown";
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, visits]) => ({ country, visits }));
  }, [filteredLogs]);

  const linkBreakdown = useMemo(() => {
    return businesses.map((b) => {
      const a = analytics.find((x) => x.business_id === b.id);
      const bLogs = logs.filter((l) => l.business_id === b.id);
      return {
        id: b.id,
        name: b.business_name,
        slug: b.slug,
        views: a?.page_views || 0,
        clicks: a?.five_star_clicks || 0,
        qr: bLogs.filter((l) => l.source === "qr").length,
        ctr: a?.page_views ? ((a.five_star_clicks / a.page_views) * 100).toFixed(1) : "0.0",
      };
    });
  }, [businesses, analytics, logs]);

  const exportFullReport = () => {
    const rows: (string | number)[][] = [
      ["Review Growth — Analytics Report"],
      ["Generated", new Date().toISOString()],
      ["Range (days)", days],
      [],
      ["Totals"],
      ["Page Views", totals.views],
      ["Google Redirects", totals.clicks],
      ["QR Scans", totals.qrScans],
      ["Private Feedback", totals.lowStar],
      [],
      ["Link Performance"],
      ["Business", "Slug", "Views", "Google Clicks", "QR Scans", "CTR %"],
      ...linkBreakdown.map((r) => [r.name, r.slug, r.views, r.clicks, r.qr, r.ctr]),
      [],
      ["Daily Activity"],
      ["Date", "Views", "QR", "Link"],
      ...dailyData.map((d) => [d.date, d.views, d.qr, d.link]),
      [],
      ["Hourly Activity"],
      ["Hour", "Visits"],
      ...hourlyData.map((h) => [h.hour, h.visits]),
      [],
      ["Devices"],
      ["Type", "Visits"],
      ...deviceData.map((d) => [d.name, d.value]),
      [],
      ["Top Countries"],
      ["Country", "Visits"],
      ...geoData.map((g) => [g.country, g.visits]),
    ];
    downloadCSV(`analytics-${format(new Date(), "yyyyMMdd")}.csv`, rows);
  };

  const exportVisitorsCSV = () => {
    const rows: (string | number)[][] = [
      ["Timestamp", "Business", "Source", "Device", "Country", "City"],
      ...filteredLogs.map((l) => {
        const b = businesses.find((x) => x.id === l.business_id);
        return [
          format(new Date(l.viewed_at), "dd/MM/yyyy HH:mm"),
          b?.business_name || "",
          l.source || "",
          l.device_type || "",
          l.country || "",
          l.city || "",
        ];
      }),
    ];
    downloadCSV(`visitors-${format(new Date(), "yyyyMMdd")}.csv`, rows);
  };

  const cards = [
    { title: "Total Views", value: totals.views, icon: Eye, color: "gradient-primary" },
    { title: "Google Clicks", value: totals.clicks, icon: MousePointerClick, color: "gradient-success" },
    { title: "QR Scans", value: totals.qrScans, icon: QrCode, color: "bg-accent" },
    { title: "Private Feedback", value: totals.lowStar, icon: Link2, color: "bg-destructive" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-12 rounded-2xl skeleton-shimmer" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />)}
          </div>
          <div className="h-72 rounded-2xl skeleton-shimmer" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight lg:text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Track views, scans, clicks and visitor insights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={businessFilter} onValueChange={setBusinessFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All review links</SelectItem>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.business_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportFullReport} variant="default" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card key={c.title} className="border-0 shadow-card hover-lift">
            <CardContent className="p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color} text-white shadow mb-3`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold font-heading">{c.value.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{c.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily activity */}
      <Card className="border-0 shadow-card mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Activity — Views, QR vs Link</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Area type="monotone" dataKey="link" stroke="hsl(var(--primary))" fill="url(#g1)" name="Link clicks" />
              <Area type="monotone" dataKey="qr" stroke="#10b981" fill="url(#g2)" name="QR scans" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Time of day */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Time of Day Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Device Breakdown</CardTitle>
            <div className="flex gap-2 text-muted-foreground">
              <Smartphone className="h-4 w-4" /><Monitor className="h-4 w-4" /><Tablet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {deviceData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No device data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geo + Link breakdown */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Globe2 className="h-4 w-4" /> Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {geoData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No location data yet</p>
            ) : (
              <div className="space-y-2.5">
                {geoData.map((g, i) => {
                  const max = geoData[0].visits;
                  return (
                    <div key={g.country}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{i + 1}. {g.country}</span>
                        <span className="text-muted-foreground">{g.visits}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full gradient-primary rounded-full" style={{ width: `${(g.visits / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Link Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {linkBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No links yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="text-left py-2 font-medium">Business</th>
                      <th className="text-right py-2 font-medium">Views</th>
                      <th className="text-right py-2 font-medium">Clicks</th>
                      <th className="text-right py-2 font-medium">QR</th>
                      <th className="text-right py-2 font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkBreakdown.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2.5 font-medium truncate max-w-[140px]">{l.name}</td>
                        <td className="py-2.5 text-right">{l.views}</td>
                        <td className="py-2.5 text-right">{l.clicks}</td>
                        <td className="py-2.5 text-right">{l.qr}</td>
                        <td className="py-2.5 text-right text-primary font-semibold">{l.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export visitors */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Raw visitor log</p>
            <p className="text-sm text-muted-foreground">{filteredLogs.length} visits captured in selected range</p>
          </div>
          <Button onClick={exportVisitorsCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export visitors
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
