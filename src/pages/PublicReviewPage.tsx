import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, Copy, Globe, Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type Language, languageLabels, t } from "@/lib/translations";
import confetti from "canvas-confetti";

interface BusinessData {
  id: string;
  business_name: string;
  google_review_url: string;
  logo_url: string | null;
  bg_image_url: string | null;
  primary_color: string | null;
  enable_feedback_filter: boolean;
  enable_predefined_reviews: boolean;
}

interface Segment {
  id: string;
  name: string;
}

interface ReviewSample {
  id: string;
  review_text: string;
  segment_id: string | null;
}

export default function PublicReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [reviews, setReviews] = useState<ReviewSample[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [step, setStep] = useState<"rate" | "negative" | "positive" | "thanks">("rate");
  const [feedbackText, setFeedbackText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const customColor = business?.primary_color || null;
  const buttonStyle = customColor ? { backgroundColor: customColor, color: "#fff" } : {};
  const accentBgStyle = customColor ? { backgroundColor: customColor } : {};

  useEffect(() => {
    const load = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }
      // Use secure RPC instead of direct table access
      const { data: bpArr } = await (supabase.rpc as any)("get_public_business", { p_slug: slug });
      const bp = bpArr?.[0];
      if (!bp) { setNotFound(true); setLoading(false); return; }
      setBusiness(bp as BusinessData);

      // Track page view via secure RPCs (with device, source, geo)
      const ua = navigator.userAgent || "";
      const isTablet = /iPad|Tablet|PlayBook/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
      const isMobile = !isTablet && /Mobi|Android|iPhone|iPod|Opera Mini|IEMobile/i.test(ua);
      const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get("src") === "qr" ? "qr" : "link";
      // Fire page view counter immediately (don't await)
      void (supabase.rpc as any)("increment_analytics", { p_business_id: bp.id, p_column: "page_views" });

      // Log detailed page view: try geo with 1.5s timeout, otherwise log without geo.
      // Exactly one log_page_view RPC fires per visit so counts stay accurate.
      (async () => {
        let country: string | null = null;
        let city: string | null = null;
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 1500);
          const r = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
          clearTimeout(tid);
          if (r.ok) {
            const geo = await r.json();
            country = geo?.country_name || null;
            city = geo?.city || null;
          }
        } catch { /* swallow — log without geo */ }
        await (supabase.rpc as any)("log_page_view", {
          p_business_id: bp.id,
          p_device_type: device,
          p_country: country,
          p_city: city,
          p_source: source,
          p_user_agent: ua.slice(0, 500),
        });
      })();

      // Fetch reviews and segments via secure RPCs
      const [{ data: revs }, { data: segs }] = await Promise.all([
        supabase.rpc("get_public_reviews", { p_business_id: bp.id }),
        supabase.rpc("get_public_segments", { p_business_id: bp.id }),
      ]);

      const shuffled = (revs || []).sort(() => Math.random() - 0.5);
      setReviews(shuffled as ReviewSample[]);
      setSegments(segs as Segment[] || []);

      // If feedback filter is OFF, skip star rating — go directly to positive reviews
      if (!bp.enable_feedback_filter) {
        // Track as 5-star click for analytics
        supabase.rpc("increment_analytics", { p_business_id: bp.id, p_column: "five_star_clicks" });
        setRating(5);
        if (bp.enable_predefined_reviews) {
          setStep("positive");
        } else {
          // Both features off — redirect to Google directly
          window.location.href = bp.google_review_url;
          return;
        }
      }

      setLoading(false);
    };
    load();
  }, [slug]);

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#f59e0b', '#10b981', '#ec4899'],
    });
  };

  const handleRating = (value: number) => {
    setRating(value);
    if (value <= 3) {
      // If feedback filter is enabled, show feedback form; otherwise redirect to Google
      if (business?.enable_feedback_filter) {
        setStep("negative");
      } else {
        // No feedback capture — just redirect to Google
        if (business) window.location.href = business.google_review_url;
      }
    } else {
      if (business) {
        supabase.rpc("increment_analytics", { p_business_id: business.id, p_column: "five_star_clicks" });
      }
      if (value === 5) {
        setTimeout(fireConfetti, 200);
      }
      // If predefined reviews enabled, show them; otherwise redirect to Google directly
      if (business?.enable_predefined_reviews) {
        setStep("positive");
      } else {
        if (business) window.location.href = business.google_review_url;
      }
    }
  };

  const submitFeedback = async () => {
    if (!business || !feedbackText.trim()) return;
    if (feedbackText.trim().length > 2000) {
      toast({ title: "Too long", description: "Feedback must be under 2000 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await (supabase.rpc as any)("submit_negative_feedback", {
      p_business_id: business.id,
      p_rating: rating,
      p_feedback_text: feedbackText.trim(),
      p_customer_name: customerName.trim(),
      p_customer_phone: customerPhone.trim(),
    });
    await supabase.rpc("increment_analytics", { p_business_id: business.id, p_column: "low_star_submissions" });
    setStep("thanks");
    setSubmitting(false);
  };

  const copyAndRedirect = async (reviewId: string, reviewText: string) => {
    try {
      await navigator.clipboard.writeText(reviewText);
      toast({ title: t(lang, "toast.copied"), description: t(lang, "toast.copied_desc") });

      // Remove from local list immediately
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));

      // Delete from database permanently via secure RPC
      await supabase.rpc("delete_copied_review", { p_review_id: reviewId, p_business_id: business.id });

      if (business) window.location.href = business.google_review_url;
    } catch {
      toast({ title: t(lang, "toast.copy_failed"), description: t(lang, "toast.copy_failed_desc"), variant: "destructive" });
    }
  };

  const filteredReviews = selectedSegment
    ? reviews.filter((r) => r.segment_id === selectedSegment)
    : reviews;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center animate-fade-in">
          <h1 className="font-heading text-2xl font-bold mb-2">{t(lang, "not_found.title")}</h1>
          <p className="text-muted-foreground">{t(lang, "not_found.subtitle")}</p>
        </div>
      </div>
    );
  }

  const LanguageToggle = () => (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowLangMenu(!showLangMenu)}
        className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium shadow-elevated backdrop-blur-md transition-all duration-200 bg-white/90 text-foreground border border-border/50 hover:bg-white"
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        {languageLabels[lang]}
      </button>
      {showLangMenu && (
        <div className="absolute right-0 top-full mt-1.5 rounded-2xl shadow-elevated border border-border/50 overflow-hidden bg-white/95 backdrop-blur-md">
          {(Object.keys(languageLabels) as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setShowLangMenu(false); }}
              className={cn(
                "block w-full px-5 py-2.5 text-left text-sm transition-colors duration-200",
                l === lang
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-secondary"
              )}
            >
              {languageLabels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <LanguageToggle />
      <div
        className={cn(
          "flex min-h-[100dvh] items-center justify-center px-5 py-8 bg-cover bg-center bg-no-repeat",
          !business?.bg_image_url && "bg-gradient-to-br from-[hsl(220,20%,96%)] via-[hsl(240,15%,95%)] to-[hsl(260,18%,94%)]"
        )}
        style={{
          ...(business?.bg_image_url ? { backgroundImage: `url(${business.bg_image_url})` } : {}),
        }}
      >
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo shown outside card for non-rate steps */}
          {step !== "rate" && (
            <div className="mb-6 text-center">
              {business?.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.business_name}
                  className="mx-auto mb-3 max-h-20 max-w-[200px] object-contain drop-shadow-sm"
                />
              ) : (
                <div
                  className={cn(
                    "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[1.25rem] shadow-lg",
                    !customColor && "gradient-primary"
                  )}
                  style={accentBgStyle}
                >
                  <Star className="h-8 w-8 text-white" fill="currentColor" />
                </div>
              )}
              <h1 className="text-xl font-bold tracking-tight font-[var(--font-heading)]">
                {business?.business_name}
              </h1>
            </div>
          )}

          {/* Step: Rating */}
          {step === "rate" && (
            <Card className="border-0 animate-scale-in bg-white/95 backdrop-blur-sm shadow-elevated rounded-3xl overflow-hidden">
              <CardContent className="px-6 py-10 sm:px-10 sm:py-12 text-center">
                <div className="mb-10">
                  {business?.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.business_name}
                      className="mx-auto mb-4 max-h-24 max-w-[220px] object-contain drop-shadow-sm"
                    />
                  ) : (
                    <>
                      <div
                        className={cn(
                          "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.25rem] shadow-lg",
                          !customColor && "gradient-primary"
                        )}
                        style={accentBgStyle}
                      >
                        <Star className="h-8 w-8 text-white" fill="currentColor" />
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight font-[var(--font-heading)]">
                        {business?.business_name}
                      </h1>
                    </>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-10 text-foreground/90">
                  {t(lang, "rate.title")}
                </h2>
                <div className="flex justify-center gap-4 sm:gap-5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleRating(value)}
                      onMouseEnter={() => setHoveredStar(value)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-all duration-200 hover:scale-125 active:scale-90 p-0.5"
                    >
                      <Star
                        className={cn(
                          "h-12 w-12 sm:h-14 sm:w-14 transition-all duration-200",
                          (hoveredStar || rating) >= value
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_hsl(45_100%_51%/0.6)]"
                            : "text-muted-foreground/25"
                        )}
                        strokeWidth={1.5}
                        style={(hoveredStar || rating) >= value ? { animation: `starGlow 0.6s ease ${value * 0.05}s both` } : {}}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Negative Feedback */}
          {step === "negative" && (
            <Card className="border-0 animate-scale-in bg-white/95 backdrop-blur-sm shadow-elevated rounded-3xl overflow-hidden">
              <CardContent className="px-6 py-8 sm:px-8">
                <div className="flex justify-center gap-1.5 mb-6">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star key={v} className={cn("h-5 w-5", v <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/25")} strokeWidth={1.5} />
                  ))}
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">
                  {t(lang, "negative.title")}
                </h2>
                <p className="text-sm text-center mb-6 text-muted-foreground">
                  {t(lang, "negative.subtitle")}
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t(lang, "negative.name_placeholder")}
                    maxLength={200}
                    className="w-full rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-ring focus:bg-white outline-none"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t(lang, "negative.phone_placeholder")}
                    maxLength={20}
                    className="w-full rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-ring focus:bg-white outline-none"
                  />
                  <Textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={t(lang, "negative.placeholder")}
                    rows={4}
                    maxLength={1000}
                    className="rounded-2xl border-border/60 bg-secondary/30 transition-all duration-200 focus:ring-2 focus:bg-white text-sm"
                  />
                </div>
                <Button
                  className="w-full mt-6 rounded-2xl h-12 text-base font-semibold transition-all duration-200 shadow-md"
                  style={customColor ? { backgroundColor: customColor, color: "#fff" } : {}}
                  onClick={submitFeedback}
                  disabled={submitting || !feedbackText.trim()}
                >
                  {submitting ? t(lang, "negative.submitting") : t(lang, "negative.submit")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step: Positive */}
          {step === "positive" && (
            <div className="animate-scale-in space-y-4">
              <Card className="border-0 overflow-hidden bg-white/95 backdrop-blur-sm shadow-elevated rounded-3xl">
                <CardContent className="px-6 py-8 sm:px-8 text-center">
                  <div className="flex justify-center gap-2 mb-5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={cn(
                          "h-7 w-7",
                          v <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/25"
                        )}
                        strokeWidth={1.5}
                        style={{ animation: `starPop 0.3s ease ${v * 0.08}s both` }}
                      />
                    ))}
                  </div>
                  <h2 className="text-xl font-bold mb-2">
                    {t(lang, "positive.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t(lang, "positive.subtitle")}
                  </p>

                  {segments.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-6 pt-6 border-t border-border/40">
                      <button
                        onClick={() => setSelectedSegment(null)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                          selectedSegment === null
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                        style={selectedSegment === null && customColor ? { backgroundColor: customColor, color: "#fff" } : {}}
                      >
                        {t(lang, "positive.all")}
                      </button>
                      {segments.map((seg) => (
                        <button
                          key={seg.id}
                          onClick={() => setSelectedSegment(seg.id)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                            selectedSegment === seg.id
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          )}
                          style={selectedSegment === seg.id && customColor ? { backgroundColor: customColor, color: "#fff" } : {}}
                        >
                          {seg.name}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-3">
                {filteredReviews.length === 0 ? (
                  <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl border-0">
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">
                      {selectedSegment ? t(lang, "positive.no_reviews_category") : t(lang, "positive.no_reviews")}
                    </CardContent>
                  </Card>
                ) : (
                  filteredReviews.map((review, i) => (
                    <Card
                      key={review.id}
                      className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated active:scale-[0.97] border-0 bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl"
                      style={{ animation: `fadeSlideUp 0.35s ease ${i * 0.06}s both` }}
                      onClick={() => copyAndRedirect(review.id, review.review_text)}
                    >
                      <CardContent className="px-5 py-4 sm:px-6 sm:py-5">
                        <p className="text-sm leading-relaxed text-foreground/90">"{review.review_text}"</p>
                        <p className="text-xs mt-3 flex items-center gap-1.5 text-muted-foreground">
                          <Copy className="h-3.5 w-3.5" /> {t(lang, "positive.tap_to_copy")}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step: Thank You */}
          {step === "thanks" && (
            <Card className="border-0 animate-scale-in bg-white/95 backdrop-blur-sm shadow-elevated rounded-3xl overflow-hidden">
              <CardContent className="px-8 py-12 sm:px-10 sm:py-14 text-center">
                <div
                  className={cn(
                    "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg",
                    !customColor && "gradient-success"
                  )}
                  style={customColor ? { backgroundColor: customColor } : {}}
                >
                  <Check
                    className="h-10 w-10 text-white"
                    style={{ animation: "checkBounce 0.6s ease both" }}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  {t(lang, "thanks.title")}
                </h2>
                <p className="text-base mb-5 text-muted-foreground">
                  {t(lang, "thanks.subtitle")}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                  <Heart className="h-4 w-4" fill="currentColor" />
                  You just supported a local business
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
