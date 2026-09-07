import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Link2, MessageSquareText, MessageSquareWarning, Users, LogOut, CreditCard, Menu, Moon, Sun, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logo from "@/assets/clarity-growth-logo.png";

const clientLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/review-link", label: "Review Link", icon: Link2 },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/positive-reviews", label: "Positive Reviews", icon: MessageSquareText },
  { to: "/dashboard/negative-feedback", label: "Negative Feedback", icon: MessageSquareWarning },
  { to: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
];

const adminLinks = [
  { to: "/admin", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/plans", label: "Plans", icon: CreditCard },
  { to: "/admin/settings", label: "Payment Settings", icon: Settings },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return { dark, toggle: () => setDark(!dark) };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useDarkMode();

  const links = role === "admin" ? adminLinks : clientLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const roleLabel = role === "admin" ? "Admin" : "Client";

  const NavContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg shadow-primary/10 p-1">
            <img src={logo} alt="Clarity Growth Advisory" className="h-full w-full object-contain" />
          </div>
          <span className="font-heading text-sm font-bold text-sidebar-foreground tracking-tight">Clarity Growth Advisory</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
              location.pathname === link.to
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        <div className="px-4">
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">{roleLabel}</div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 rounded-xl px-4 text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[260px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <NavContent />
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Desktop Top Bar */}
        <header className="hidden h-12 items-center justify-end gap-2 border-b px-6 lg:flex">
          <button onClick={toggle} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0">
                <NavContent onLinkClick={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1">
                <img src={logo} alt="Clarity Growth Advisory" className="h-full w-full object-contain" />
              </div>
              <span className="font-heading text-sm font-bold">Clarity Growth Advisory</span>
            </Link>
          </div>
          <button onClick={toggle} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-10">
          <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
