import { useEffect, useState, useRef, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Upload, X, Check, Download, Star, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";

interface BusinessProfile {
  id: string;
  business_name: string;
  google_review_url: string;
  slug: string;
  logo_url: string | null;
  bg_image_url: string | null;
  theme: string;
  primary_color: string | null;
  font_family: string | null;
}

/* ─── Live Preview Component (Desktop only) ─── */
function LivePreview({
  businessName,
  logoPreview,
  bgImagePreview,
  primaryColor,
}: {
  businessName: string;
  logoPreview: string | null;
  bgImagePreview: string | null;
  primaryColor: string;
}) {
  const accentBgStyle = primaryColor ? { backgroundColor: primaryColor } : {};
  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <div className="sticky top-6">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Live Preview</span>
      </div>
      <div
        className={cn(
          "rounded-2xl overflow-hidden border border-border shadow-elevated",
          "aspect-[9/16] max-h-[680px] flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat",
          !bgImagePreview && "bg-[hsl(220,14%,96%)]"
        )}
        style={{
          ...(bgImagePreview ? { backgroundImage: `url(${bgImagePreview})` } : {}),
        }}
      >
        {/* Simulated rating card */}
        <div className="w-full max-w-[280px] animate-scale-in">
          <div className="rounded-2xl border-0 p-6 text-center bg-white shadow-lg">
            {/* Logo or icon */}
            <div className="mb-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={businessName}
                  className="mx-auto mb-2 max-h-16 max-w-[160px] object-contain"
                />
              ) : (
                <div
                  className={cn("mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl", !primaryColor && "bg-primary")}
                  style={accentBgStyle}
                >
                  <Star className="h-5 w-5 text-white" fill="currentColor" />
                </div>
              )}
              <h2 className="text-lg font-bold leading-tight">
                {businessName || "Your Business"}
              </h2>
            </div>

            <p className="text-sm font-medium mb-4">
              How was your experience?
            </p>

            {/* Stars */}
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onMouseEnter={() => setHoveredStar(value)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform duration-200 hover:scale-110 p-0.5"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-all duration-200",
                      hoveredStar >= value
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted"
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Sample review card below */}
            <div className="mt-5 pt-4 border-t border-black/5">
              <div className="rounded-xl p-3 text-left text-xs leading-relaxed bg-black/[0.03] text-muted-foreground">
                "Great experience! The service was excellent and I'll definitely be coming back."
                <p className="text-[10px] mt-1.5 flex items-center gap-1 text-muted-foreground/60">
                  <Copy className="h-2.5 w-2.5" /> Tap to copy & review
                </p>
              </div>
            </div>

            {/* CTA button */}
            <button
              className="w-full mt-4 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 text-white"
              style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
            >
              Leave a Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewLinkSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#6b46c1");
  const [enableFeedbackFilter, setEnableFeedbackFilter] = useState(true);
  const [enablePredefinedReviews, setEnablePredefinedReviews] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addLogoToQR, setAddLogoToQR] = useState(true);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const bp = data as BusinessProfile;
          setProfile(bp);
          setBusinessName(bp.business_name);
          setGoogleUrl(bp.google_review_url);
          setSlug(bp.slug);
          setLogoUrl(bp.logo_url);
          setLogoPreview(bp.logo_url);
          setBgImageUrl((data as any).bg_image_url || null);
          setBgImagePreview((data as any).bg_image_url || null);
          setPrimaryColor((data as any).primary_color || "#6b46c1");
          setEnableFeedbackFilter((data as any).enable_feedback_filter ?? true);
          setEnablePredefinedReviews((data as any).enable_predefined_reviews ?? true);
        }
      });
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("business-logos").upload(filePath, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("business-logos").getPublicUrl(filePath);
    setLogoUrl(urlData.publicUrl);
    setLogoPreview(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Logo uploaded!", description: "Don't forget to save your changes." });
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setLogoPreview(null);
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Background image must be under 5MB.", variant: "destructive" });
      return;
    }
    setUploadingBg(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/bg-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("business-logos").upload(filePath, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingBg(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("business-logos").getPublicUrl(filePath);
    setBgImageUrl(urlData.publicUrl);
    setBgImagePreview(urlData.publicUrl);
    setUploadingBg(false);
    toast({ title: "Background uploaded!", description: "Don't forget to save your changes." });
  };

  const removeBgImage = () => {
    setBgImageUrl(null);
    setBgImagePreview(null);
  };

  const isValidGoogleUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch { return false; }
  };

  const handleSave = async () => {
    if (!user || !businessName || !googleUrl || !slug) return;
    if (!isValidGoogleUrl(googleUrl)) {
      toast({ title: "Invalid URL", description: "Google Review URL must start with https://", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        business_name: businessName,
        google_review_url: googleUrl,
        slug,
        logo_url: logoUrl,
        bg_image_url: bgImageUrl,
        theme: "default",
        primary_color: primaryColor,
        font_family: null,
        enable_feedback_filter: enableFeedbackFilter,
        enable_predefined_reviews: enablePredefinedReviews,
      };
      if (profile) {
        const { error } = await (supabase.from("business_profiles") as any).update(payload).eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("business_profiles") as any).insert({ user_id: user.id, ...payload });
        if (error) throw error;
      }
      toast({ title: "Saved!", description: "Your review link has been configured." });
      const { data } = await supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(data as BusinessProfile);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = `${window.location.origin}/review/${slug}`;
  const qrUrl = `${publicUrl}?src=qr`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "Copied!", description: "Review link copied to clipboard." });
  };

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);

  const generateQRWithLogo = useCallback(async () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    await QRCode.toCanvas(canvas, qrUrl, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    });

    if (logoPreview && addLogoToQR) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const logoSize = size * 0.22;
          const padding = 6;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2, 8);
          ctx.fill();
          ctx.drawImage(img, x, y, logoSize, logoSize);
          setQrReady(true);
        };
        img.src = logoPreview;
      }
    } else {
      setQrReady(true);
    }
  }, [qrUrl, logoPreview, addLogoToQR]);

  useEffect(() => {
    if (profile) {
      generateQRWithLogo();
    }
  }, [profile, generateQRWithLogo]);

  const downloadQR = () => {
    if (!qrCanvasRef.current) return;
    const dataUrl = qrCanvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "QR Downloaded!", description: "Your QR code has been downloaded." });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Review Link Setup</h1>
        <p className="text-sm text-muted-foreground">Configure your public review link</p>
      </div>

      {/* Desktop: side-by-side | Mobile: form only */}
      <div className="flex gap-8">
        {/* Left: Form */}
        <div className="flex-1 min-w-0">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Business logo" className="h-16 w-16 rounded-xl object-cover border border-border" />
                      <button onClick={removeLogo} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="h-16 w-16 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? "Uploading..." : logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 2MB. JPG, PNG or WebP.</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Restaurant" />
              </div>
              <div className="space-y-2">
                <Label>Google Review URL</Label>
                <Input value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} placeholder="https://search.google.com/local/writereview?placeid=..." />
              </div>
              <div className="space-y-2">
                <Label>Custom Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="my-restaurant" />
              </div>

              {/* Custom Brand Color */}
              <div className="space-y-2">
                <Label>Brand Color <span className="text-xs text-muted-foreground">(used for buttons & accents on your review page)</span></Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#6b46c1"
                    className="w-32 font-mono text-sm"
                  />
                  <div
                    className="h-10 flex-1 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Preview
                  </div>
                </div>
              </div>

              {/* Background Image Upload */}
              <div className="space-y-2">
                <Label>Custom Background Image <span className="text-xs text-muted-foreground">(optional — overrides default background)</span></Label>
                <div className="flex items-center gap-4">
                  {bgImagePreview ? (
                    <div className="relative">
                      <img src={bgImagePreview} alt="Background" className="h-16 w-28 rounded-lg object-cover border border-border" />
                      <button onClick={removeBgImage} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => bgInputRef.current?.click()} className="h-16 w-28 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Button variant="outline" size="sm" onClick={() => bgInputRef.current?.click()} disabled={uploadingBg}>
                      {uploadingBg ? "Uploading..." : bgImagePreview ? "Change Background" : "Upload Background"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB. JPG, PNG or WebP.</p>
                  </div>
                  <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-4 pt-2">
                <Label className="text-base font-semibold">Features</Label>
                <div className="rounded-xl border border-border p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Feedback Filter</p>
                      <p className="text-xs text-muted-foreground">Capture private feedback for 1–3 star ratings (name, phone & message)</p>
                    </div>
                    <Switch checked={enableFeedbackFilter} onCheckedChange={setEnableFeedbackFilter} />
                  </div>
                  <div className="border-t border-border/50" />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Predefined Reviews</p>
                      <p className="text-xs text-muted-foreground">Show ready-made review samples for 4–5 star ratings to copy & paste on Google</p>
                    </div>
                    <Switch checked={enablePredefinedReviews} onCheckedChange={setEnablePredefinedReviews} />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving || !businessName || !googleUrl || !slug}>
                {saving ? "Saving..." : profile ? "Update" : "Create Review Link"}
              </Button>

              {profile && (
                <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Your Public Review Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono">{publicUrl}</code>
                    <Button variant="outline" size="icon" onClick={copyLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  {/* QR Code Download */}
                  <div className="mt-4 flex items-center gap-4 pt-4 border-t border-border">
                    <canvas
                      ref={qrCanvasRef}
                      className="h-[120px] w-[120px] rounded-lg border border-border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">QR Code</p>
                      <p className="text-xs text-muted-foreground mb-2">Download and print this QR code so customers can scan it to leave a review.</p>
                      {logoPreview && (
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                          <Checkbox
                            checked={addLogoToQR}
                            onCheckedChange={(checked) => setAddLogoToQR(!!checked)}
                          />
                          <span className="text-sm">Add logo to QR code</span>
                        </label>
                      )}
                      <Button variant="outline" size="sm" onClick={downloadQR}>
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview (Desktop only) */}
        <div className="hidden xl:block w-[340px] shrink-0">
          <LivePreview
            businessName={businessName}
            logoPreview={logoPreview}
            bgImagePreview={bgImagePreview}
            primaryColor={primaryColor}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
