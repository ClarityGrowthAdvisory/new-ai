import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const ReviewLinkSetup = lazy(() => import("@/pages/ReviewLinkSetup"));
const PositiveReviewsPage = lazy(() => import("@/pages/PositiveReviewsPage"));
const NegativeFeedbackPage = lazy(() => import("@/pages/NegativeFeedbackPage"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminPlansPage = lazy(() => import("@/pages/AdminPlansPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/AdminAnalyticsPage"));
const PublicReviewPage = lazy(() => import("@/pages/PublicReviewPage"));
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

function AuthRedirectOrIndex() {
  const { user, role, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user && role) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<AuthRedirectOrIndex />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/review/:slug" element={<PublicReviewPage />} />

              {/* Client routes */}
              <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
                <Route path="/dashboard" element={<ClientDashboard />} />
                <Route path="/dashboard/review-link" element={<ReviewLinkSetup />} />
                <Route path="/dashboard/positive-reviews" element={<PositiveReviewsPage />} />
                <Route path="/dashboard/negative-feedback" element={<NegativeFeedbackPage />} />
                <Route path="/dashboard/subscription" element={<SubscriptionPage />} />
                <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/plans" element={<AdminPlansPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
