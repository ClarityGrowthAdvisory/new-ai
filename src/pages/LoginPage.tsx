import { useState, useEffect } from "react";
import logo from "@/assets/clarity-growth-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/dashboard", { replace: true });
    }
  }, [user, role, loading, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We've sent you a password reset link." });
        setIsForgot(false);
      } else if (isSignUp) {
        const { error } = await signUp(email, password, name, phone);
        if (error) throw error;
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Fetch role to determine redirect
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          const userRole = roleData?.role;
          if (userRole === "admin") navigate("/admin");
          else navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md p-2">
            <img src={logo} alt="Clarity Growth Advisory" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-neutral-50">Clarity Growth Advisory</h1>
          <p className="mt-1 text-sm text-neutral-400">Boost your Google reviews effortlessly</p>
        </div>

        <Card className="shadow-elevated border border-neutral-800 bg-neutral-900 text-neutral-100">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl">{isForgot ? "Reset Password" : isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>{isForgot ? "Enter your email to receive a reset link" : isSignUp ? "Sign up to get started" : "Sign in to your dashboard"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && !isForgot && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="text-black placeholder:text-neutral-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" required maxLength={15} className="text-black placeholder:text-neutral-500" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="text-black placeholder:text-neutral-500" />
              </div>
              {!isForgot && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="pr-10 text-black placeholder:text-neutral-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : isForgot ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              {isForgot ? (
                <button type="button" onClick={() => setIsForgot(false)} className="text-sm text-primary hover:underline">
                  Back to sign in
                </button>
              ) : (
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:underline">
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
