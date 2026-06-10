import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  ArrowRight,
  ArrowUpRight,
  Check,
  ShieldCheck,
  TrendingUp,
  Zap,
  Sparkles,
  QrCode,
  MessageSquareQuote,
  BarChart3,
} from "lucide-react";
import logo from "@/assets/clarity-growth-logo.png";

/* ───────── Theme tokens (scoped to this page only) ───────── */
const NOIR = "#0d0d0d";
const NOIR_2 = "#1a1a1a";
const GOLD = "#c9a84c";
const GOLD_SOFT = "#f0d78c";

const headingFont = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };
const bodyFont = { fontFamily: "'DM Sans', system-ui, sans-serif" };

/* ───────── Navbar ───────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? "rgba(13,13,13,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${GOLD}22` : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "#fff", boxShadow: `0 0 0 1px ${GOLD}44, 0 8px 24px ${GOLD}22` }}
          >
            <img src={logo} alt="Clarity Growth Advisory" className="h-9 w-9 object-contain" />
          </div>
          <span style={{ ...headingFont, color: GOLD_SOFT }} className="text-base font-semibold tracking-tight">
            Clarity Growth <span style={{ color: GOLD }}>Advisory</span>
          </span>
        </Link>

        <div className="hidden items-center gap-10 md:flex" style={bodyFont}>
          {["Features", "How it Works"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium transition-colors"
              style={{ color: "#bdbdbd" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#bdbdbd")}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium transition-colors md:inline-flex"
            style={{ ...bodyFont, color: GOLD_SOFT }}
          >
            Log in
          </Link>
          <Link
            to="/login"
            className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              ...bodyFont,
              background: GOLD,
              color: NOIR,
              boxShadow: `0 8px 24px ${GOLD}33`,
            }}
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ───────── Hero: Split screen ───────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* ambient gold glow */}
      <div
        className="pointer-events-none absolute -top-40 right-[-20%] h-[600px] w-[600px] rounded-full opacity-30"
        style={{ background: `radial-gradient(circle, ${GOLD}55, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(${GOLD} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
        {/* LEFT */}
        <div>
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em]"
            style={{ ...bodyFont, borderColor: `${GOLD}55`, color: GOLD_SOFT, background: `${GOLD}0d` }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD }} />
            Premium Reputation Engine
          </div>

          <h1
            style={{ ...headingFont, color: "#fafafa" }}
            className="text-[44px] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[68px]"
          >
            Turn every visit into a
            <br />
            <span
              style={{
                background: `linear-gradient(120deg, ${GOLD_SOFT}, ${GOLD} 60%, #8a6f2c)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              five-star moment.
            </span>
          </h1>

          <p
            className="mt-7 max-w-xl text-lg leading-relaxed"
            style={{ ...bodyFont, color: "#a8a8a8" }}
          >
            Capture private feedback from unhappy customers. Send the happy ones
            straight to Google. Built for businesses that take their reputation
            seriously.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all"
              style={{
                ...bodyFont,
                background: GOLD,
                color: NOIR,
                boxShadow: `0 12px 32px ${GOLD}40`,
              }}
            >
              Start free trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold transition-all"
              style={{
                ...bodyFont,
                borderColor: `${GOLD}55`,
                color: GOLD_SOFT,
                background: "transparent",
              }}
            >
              See how it works
            </a>
          </div>

          {/* trust strip */}
          <div className="mt-12 flex items-center gap-6 border-t pt-7" style={{ borderColor: `${GOLD}22` }}>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full border-2"
                  style={{
                    borderColor: NOIR,
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_SOFT})`,
                  }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4" style={{ color: GOLD }} fill={GOLD} />
                ))}
              </div>
              <p className="mt-1 text-xs" style={{ ...bodyFont, color: "#9a9a9a" }}>
                Trusted by <span style={{ color: GOLD_SOFT }}>500+ businesses</span> across India
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — visual card */}
        <div className="relative">
          <div
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border p-8"
            style={{
              borderColor: `${GOLD}33`,
              background: `linear-gradient(160deg, ${NOIR_2}, ${NOIR})`,
              boxShadow: `0 30px 80px -20px ${GOLD}33, inset 0 1px 0 ${GOLD}22`,
            }}
          >
            {/* corner gradient */}
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50"
              style={{ background: `radial-gradient(circle, ${GOLD}55, transparent 70%)` }}
            />

            {/* live review preview */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ ...bodyFont, color: GOLD }}>
                Live preview
              </span>
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: GOLD }} />
            </div>

            <div className="mt-8">
              <h3 style={{ ...headingFont, color: "#fff" }} className="text-2xl font-semibold">
                How was your visit?
              </h3>
              <p className="mt-2 text-sm" style={{ ...bodyFont, color: "#a8a8a8" }}>
                Tap a star to leave your rating
              </p>
              <div className="mt-6 flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border transition-all"
                    style={{
                      borderColor: i <= 5 ? `${GOLD}66` : "#333",
                      background: i <= 5 ? `${GOLD}1a` : "transparent",
                    }}
                  >
                    <Star className="h-6 w-6" style={{ color: GOLD }} fill={GOLD} />
                  </div>
                ))}
              </div>
            </div>

            {/* flow stat tiles */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `${GOLD}22`, background: `${GOLD}08` }}
              >
                <TrendingUp className="h-5 w-5" style={{ color: GOLD }} />
                <p className="mt-3 text-2xl font-bold" style={{ ...headingFont, color: "#fff" }}>
                  +218%
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wider" style={{ ...bodyFont, color: "#9a9a9a" }}>
                  Avg review lift
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `${GOLD}22`, background: `${GOLD}08` }}
              >
                <ShieldCheck className="h-5 w-5" style={{ color: GOLD }} />
                <p className="mt-3 text-2xl font-bold" style={{ ...headingFont, color: "#fff" }}>
                  4.8★
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wider" style={{ ...bodyFont, color: "#9a9a9a" }}>
                  Avg Google rating
                </p>
              </div>
            </div>

            <div
              className="mt-4 flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ borderColor: `${GOLD}22`, background: `${GOLD}08` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: GOLD, color: NOIR }}
                >
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ ...bodyFont, color: "#fff" }}>
                    Branded QR ready
                  </p>
                  <p className="text-[11px]" style={{ ...bodyFont, color: "#9a9a9a" }}>
                    Print, tap, scan, share
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4" style={{ color: GOLD }} />
            </div>
          </div>

          {/* floating badge */}
          <div
            className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-2xl border px-5 py-4 sm:flex"
            style={{
              borderColor: `${GOLD}55`,
              background: NOIR_2,
              boxShadow: `0 18px 40px -12px ${GOLD}44`,
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: GOLD, color: NOIR }}
            >
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ ...bodyFont, color: "#9a9a9a" }}>
                Setup time
              </p>
              <p className="text-sm font-semibold" style={{ ...bodyFont, color: "#fff" }}>
                Under 2 minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Feature row ───────── */
function Features() {
  const items = [
    {
      icon: MessageSquareQuote,
      title: "Filter Negative Feedback",
      desc: "1-3 star reviews go private to you — never to Google. Fix the issue before it hurts your rating.",
    },
    {
      icon: TrendingUp,
      title: "Channel 5★ to Google",
      desc: "Happy customers are redirected to your Google review page in one tap, multiplying public ratings.",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      desc: "Page visits, clicks, conversion rate — see exactly how your reputation is growing every day.",
    },
    {
      icon: QrCode,
      title: "Branded QR Codes",
      desc: "Generate beautiful QR codes with your logo. Print on cards, stands, receipts, or table tents.",
    },
  ];

  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <span
              className="text-xs font-medium uppercase tracking-[0.22em]"
              style={{ ...bodyFont, color: GOLD }}
            >
              Why Clarity
            </span>
            <h2
              style={{ ...headingFont, color: "#fff" }}
              className="mt-5 text-4xl font-bold leading-[1.1] sm:text-5xl"
            >
              Engineered for
              <br />
              businesses that
              <br />
              <span style={{ color: GOLD }}>care about craft.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed" style={{ ...bodyFont, color: "#a8a8a8" }}>
              No bloated features. No fake reviews. Just a clean, focused tool
              that does one thing exceptionally well — protect and grow your
              reputation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {items.map((it, i) => (
              <div
                key={i}
                className="group rounded-3xl border p-7 transition-all"
                style={{
                  borderColor: `${GOLD}22`,
                  background: `linear-gradient(160deg, ${NOIR_2}, ${NOIR})`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD}66`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD}22`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: `${GOLD}1a`, color: GOLD }}
                >
                  <it.icon className="h-6 w-6" />
                </div>
                <h3
                  className="mt-6 text-xl font-semibold"
                  style={{ ...headingFont, color: "#fff" }}
                >
                  {it.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ ...bodyFont, color: "#a0a0a0" }}>
                  {it.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── How it works ───────── */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Set up your page", d: "Add your business name, logo, and Google review link in under a minute." },
    { n: "02", t: "Share your QR", d: "Print branded QR codes or share the link via WhatsApp, email, or SMS." },
    { n: "03", t: "Customers rate", d: "They tap a star. 1-3 stars stay private. 4-5 stars go to Google instantly." },
    { n: "04", t: "Watch reviews grow", d: "Track every visit, click, and conversion from your analytics dashboard." },
  ];

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32" style={{ background: NOIR_2 }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.22em]" style={{ ...bodyFont, color: GOLD }}>
            How it works
          </span>
          <h2 style={{ ...headingFont, color: "#fff" }} className="mt-5 text-4xl font-bold sm:text-5xl">
            Four steps. <span style={{ color: GOLD }}>Zero friction.</span>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative rounded-3xl border p-7"
              style={{ borderColor: `${GOLD}22`, background: NOIR }}
            >
              <span
                className="text-5xl font-bold"
                style={{
                  ...headingFont,
                  background: `linear-gradient(180deg, ${GOLD}, ${GOLD}33)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold" style={{ ...headingFont, color: "#fff" }}>
                {s.t}
              </h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ ...bodyFont, color: "#9a9a9a" }}>
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



/* ───────── Final CTA ───────── */
function CTA() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at center, ${GOLD}33, transparent 60%)`,
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
        <h2 style={{ ...headingFont, color: "#fff" }} className="text-4xl font-bold leading-[1.1] sm:text-6xl">
          Your reputation deserves
          <br />
          <span style={{ color: GOLD }}>this much craft.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed" style={{ ...bodyFont, color: "#a8a8a8" }}>
          Join 500+ businesses already turning every customer into a five-star
          moment. Free for 7 days. No credit card.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/login"
            className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-all"
            style={{ ...bodyFont, background: GOLD, color: NOIR, boxShadow: `0 18px 40px ${GOLD}44` }}
          >
            Start your free trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm font-semibold"
            style={{ ...bodyFont, borderColor: `${GOLD}55`, color: GOLD_SOFT }}
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────── Footer ───────── */
function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: `${GOLD}22`, background: NOIR }}>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "#fff" }}
            >
              <img src={logo} alt="Clarity Growth Advisory" className="h-8 w-8 object-contain" />
            </div>
            <span style={{ ...headingFont, color: GOLD_SOFT }} className="text-sm font-semibold">
              Clarity Growth Advisory
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm" style={bodyFont}>
            {["Features"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                style={{ color: "#9a9a9a" }}
                className="transition-colors hover:!text-[color:var(--tw)]"
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9a9a")}
              >
                {l}
              </a>
            ))}
            <Link
              to="/login"
              style={{ color: "#9a9a9a" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9a9a")}
            >
              Login
            </Link>
          </div>
          <p className="text-xs" style={{ ...bodyFont, color: "#6e6e6e" }}>
            © 2026 Clarity Growth Advisory
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ───────── Page ───────── */
const Index = () => (
  <div className="min-h-screen" style={{ background: NOIR, color: "#fff" }}>
    <Navbar />
    <Hero />
    <Features />
    <HowItWorks />
    <CTA />
    <Footer />
  </div>
);

export default Index;
