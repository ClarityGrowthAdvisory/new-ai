import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, KeyRound, MoreVertical, CreditCard, ShieldCheck, ShieldOff, Search, Download, ChevronLeft, ChevronRight, Trash2, Users, Link2 } from "lucide-react";
import { validityLabel } from "@/lib/planDuration";


interface Plan { id: string; name: string; validity_days: number; }
interface UserPlan { user_id: string; plan_id: string | null; expires_at: string; }

interface UserData {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  business_name: string | null;
  plan_id: string | null;
  plan_name: string | null;
  plan_expires: string | null;
}

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", phone: "" });
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: "", name: "" });
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [planDialog, setPlanDialog] = useState<{ open: boolean; user: UserData | null }>({ open: false, user: null });
  const [selectedPlanId, setSelectedPlanId] = useState<string>("none");
  const [customExpiry, setCustomExpiry] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [expiryFilter, setExpiryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const { toast } = useToast();

  const load = async () => {
    const [{ data: profiles }, { data: businesses }, { data: plansData }, { data: userPlans }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("business_profiles").select("*"),
      supabase.from("plans").select("*").eq("is_active", true).order("price"),
      supabase.from("user_plans").select("*"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    setPlans((plansData as Plan[]) || []);

    const planMap = new Map((plansData || []).map((p: any) => [p.id, p.name]));
    const userPlanMap = new Map((userPlans || []).map((up: any) => [up.user_id, up]));
    const adminIds = new Set((roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));

    // Show all client users (exclude admins and self)
    const userList: UserData[] = (profiles || [])
      .filter((p: any) => !adminIds.has(p.user_id) && p.user_id !== authUser?.id)
      .map((p: any) => {
        const biz = businesses?.find((b: any) => b.user_id === p.user_id);
        const up = userPlanMap.get(p.user_id) as UserPlan | undefined;
        return {
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          email: p.email,
          phone: p.phone || "",
          is_active: p.is_active,
          business_name: biz?.business_name || null,
          plan_id: up?.plan_id || null,
          plan_name: up?.plan_id ? (planMap.get(up.plan_id) as string) || null : null,
          plan_expires: up?.expires_at || null,
        };
      });
    setUsers(userList);
  };

  useEffect(() => { load(); }, [authUser]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();
    return users.filter((u) => {
      if (q) {
        const match = [u.email, u.phone, u.business_name, u.name].some((v) => (v || "").toLowerCase().includes(q));
        if (!match) return false;
      }
      if (expiryFilter === "expired") return u.plan_expires && new Date(u.plan_expires) < now;
      if (expiryFilter === "7days") { if (!u.plan_expires) return false; const d = (new Date(u.plan_expires).getTime() - now.getTime()) / 86400000; return d >= 0 && d <= 7; }
      if (expiryFilter === "30days") { if (!u.plan_expires) return false; const d = (new Date(u.plan_expires).getTime() - now.getTime()) / 86400000; return d >= 0 && d <= 30; }
      if (expiryFilter === "active") return u.plan_expires && new Date(u.plan_expires) >= now;
      if (expiryFilter === "no_plan") return !u.plan_expires;
      return true;
    });
  }, [users, searchQuery, expiryFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, expiryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const isPlanExpired = (expires: string | null) => expires ? new Date(expires) < new Date() : false;

  const toggleActive = async (user: UserData) => {
    const { error } = await supabase.from("profiles").update({ is_active: !user.is_active }).eq("id", user.id);
    if (!error) {
      setUsers(users.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
      toast({ title: user.is_active ? "User disabled" : "User enabled" });
    }
  };

  const openPlanDialog = (u: UserData) => {
    setPlanDialog({ open: true, user: u });
    setSelectedPlanId(u.plan_id || "none");
    setCustomExpiry(u.plan_expires ? new Date(u.plan_expires).toISOString().slice(0, 10) : "");
  };

  const computeExpiry = (planId: string, extend: boolean, user: UserData | null) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return null;
    const now = new Date();
    const base =
      extend && user?.plan_expires && new Date(user.plan_expires) > now
        ? new Date(user.plan_expires)
        : now;
    const d = new Date(base);
    d.setDate(d.getDate() + (plan.validity_days || 30));
    return d;
  };

  const savePlan = async (mode: "set" | "extend") => {
    const u = planDialog.user;
    if (!u) return;
    setSavingPlan(true);
    try {
      if (selectedPlanId === "none") {
        await supabase.from("user_plans").delete().eq("user_id", u.user_id);
        toast({ title: "Plan removed" });
      } else {
        const plan = plans.find((p) => p.id === selectedPlanId);
        if (!plan) return;
        const auto = computeExpiry(selectedPlanId, mode === "extend", u);
        const expiresAt =
          mode === "set" && customExpiry ? new Date(`${customExpiry}T23:59:59`) : auto!;
        await supabase.from("user_plans").delete().eq("user_id", u.user_id);
        const { error } = await supabase.from("user_plans").insert({
          user_id: u.user_id,
          plan_id: selectedPlanId,
          expires_at: expiresAt.toISOString(),
        });
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
          setSavingPlan(false);
          return;
        }
        toast({
          title: mode === "extend" ? `Plan extended` : `Plan "${plan.name}" updated`,
          description: `Valid until ${expiresAt.toLocaleDateString("en-GB")}`,
        });
      }
      setPlanDialog({ open: false, user: null });
      await load();
    } finally {
      setSavingPlan(false);
    }
  };


  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("admin-users", {
        body: { action: "create-user", email: newUser.email, password: newUser.password, name: newUser.name, phone: newUser.phone, role: "client" },
      });
      if (res.error || res.data?.error) {
        toast({ title: "Error", description: res.data?.error || res.error?.message, variant: "destructive" });
      } else {
        toast({ title: "User created successfully" });
        setCreateOpen(false);
        setNewUser({ email: "", password: "", name: "", phone: "" });
        setTimeout(() => load(), 1000);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Delete user "${user.name || user.email}"?`)) return;
    const res = await supabase.functions.invoke("admin-users", { body: { action: "delete-user", user_id: user.user_id } });
    if (res.error || res.data?.error) toast({ title: "Error", description: res.data?.error || res.error?.message, variant: "destructive" });
    else { toast({ title: "User deleted" }); load(); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setUpdatingPassword(true);
    const res = await supabase.functions.invoke("admin-users", { body: { action: "update-password", user_id: passwordDialog.userId, password: newPassword } });
    if (res.error || res.data?.error) toast({ title: "Error", description: res.data?.error || res.error?.message, variant: "destructive" });
    else { toast({ title: "Password updated!" }); setPasswordDialog({ open: false, userId: "", name: "" }); setNewPassword(""); }
    setUpdatingPassword(false);
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Business", "Plan", "Plan Expiry", "Status"];
    const rows = filteredUsers.map((u) => [u.name || "", u.email, u.phone || "", u.business_name || "", u.plan_name || "No Plan", u.plan_expires ? new Date(u.plan_expires).toLocaleDateString() : "", u.is_active ? "Active" : "Disabled"]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my_users_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Stats for header
  const totalReviewLinks = users.filter((u) => u.business_name).length;

  return (
    <DashboardLayout>
      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-muted p-3 text-green-600"><Users className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">My Users</p><p className="text-2xl font-bold">{users.length}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-muted p-3 text-purple-600"><Link2 className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Review Links</p><p className="text-2xl font-bold">{totalReviewLinks}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Users</h1>
          <p className="text-sm text-muted-foreground">{filteredUsers.length} of {users.length} users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><UserPlus className="h-4 w-4" /> Create User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Name</Label><Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Doe" /></div>
                <div className="space-y-2"><Label>Contact Number</Label><Input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="+91 9876543210" maxLength={15} /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" /></div>
                <div className="space-y-2"><Label>Password *</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" /></div>
                <Button className="w-full" onClick={handleCreateUser} disabled={creating}>{creating ? "Creating..." : "Create User"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone, or business..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Plan Expiry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active Plans</SelectItem>
            <SelectItem value="7days">Expiring in 7 days</SelectItem>
            <SelectItem value="30days">Expiring in 30 days</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="no_plan">No Plan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || "—"}</TableCell>
                    <TableCell>{u.business_name || "—"}</TableCell>
                    <TableCell>
                      {u.plan_name ? (
                        <div>
                          <Badge variant="outline" className="text-xs">{u.plan_name}</Badge>
                          {u.plan_expires && (
                            <p className={`text-[10px] mt-0.5 ${isPlanExpired(u.plan_expires) ? "text-destructive" : "text-muted-foreground"}`}>
                              {isPlanExpired(u.plan_expires) ? "Expired" : "Expires"}: {new Date(u.plan_expires).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">No Plan</span>}
                    </TableCell>
                    <TableCell><Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Active" : "Disabled"}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Manage</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openPlanDialog(u)}>
                            <CreditCard className="h-4 w-4 mr-2" /> Change Plan
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleActive(u)}>
                            {u.is_active ? <><ShieldOff className="h-4 w-4 mr-2" /> Disable</> : <><ShieldCheck className="h-4 w-4 mr-2" /> Enable</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setPasswordDialog({ open: true, userId: u.user_id, name: u.name || u.email }); setNewPassword(""); }}>
                            <KeyRound className="h-4 w-4 mr-2" /> Change Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(u)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {filteredUsers.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={planDialog.open} onOpenChange={(open) => setPlanDialog({ ...planDialog, open })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Change Plan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            For <strong>{planDialog.user?.name || planDialog.user?.email}</strong>
            {planDialog.user?.plan_expires && (
              <> — currently {isPlanExpired(planDialog.user.plan_expires) ? "expired on" : "valid until"}{" "}
              {new Date(planDialog.user.plan_expires).toLocaleDateString("en-GB")}</>
            )}
          </p>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={selectedPlanId}
                onValueChange={(v) => {
                  setSelectedPlanId(v);
                  const d = computeExpiry(v, false, planDialog.user);
                  setCustomExpiry(d ? d.toISOString().slice(0, 10) : "");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Plan</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {validityLabel(p.validity_days)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPlanId !== "none" && (
              <div className="space-y-2">
                <Label>Expiry date</Label>
                <Input type="date" value={customExpiry} onChange={(e) => setCustomExpiry(e.target.value)} />
                <p className="text-xs text-muted-foreground">Auto-filled from the plan validity — change it for a custom end date.</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => savePlan("set")} disabled={savingPlan}>
                {savingPlan ? "Saving..." : "Save"}
              </Button>
              {selectedPlanId !== "none" && (
                <Button variant="outline" className="flex-1" onClick={() => savePlan("extend")} disabled={savingPlan}>
                  Extend
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog({ ...passwordDialog, open })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Set a new password for <strong>{passwordDialog.name}</strong></p>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" /></div>
            <Button className="w-full" onClick={handleUpdatePassword} disabled={updatingPassword}>{updatingPassword ? "Updating..." : "Update Password"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
