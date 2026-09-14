import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerRoute from "./components/OwnerRoute";
import { RouteSeo } from "./components/Seo";

const Landing = lazy(() => import("./features/marketing/Landing"));
const Login = lazy(() => import("./features/auth/Login"));
const Register = lazy(() => import("./features/auth/Register"));
const Dashboard = lazy(() => import("./features/links/Dashboard"));
const Analytics = lazy(() => import("./features/analytics/Analytics"));
const AnalyticsDashboard = lazy(() => import("./features/analytics/AnalyticsDashboard"));
const Campaigns = lazy(() => import("./features/campaigns/Campaigns"));
const Blog = lazy(() => import("./features/blog/Blog"));
const BlogPost = lazy(() => import("./features/blog/BlogPost"));
const Profile = lazy(() => import("./features/links/Profile"));
const ForgotPassword = lazy(() => import("./features/auth/ForgotPassword"));
const Accuracy = lazy(() => import("./features/marketing/Accuracy"));
const Features = lazy(() => import("./features/marketing/Features"));
const Pricing = lazy(() => import("./features/marketing/Pricing"));
const TermsOfService = lazy(() => import("./features/marketing/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./features/marketing/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./features/marketing/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./features/marketing/ShippingPolicy"));
const PasswordProtected = lazy(() => import("./features/public/PasswordProtected"));
const PreClick = lazy(() => import("./features/analytics/PreClick"));
const SocketProvider = lazy(() => import("./socket/SocketProvider"));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-slate-50" aria-busy="true">
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, [pathname]);

  return null;
}

function AuthenticatedShell() {
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const [displayPath, setDisplayPath] = useState(pathname);
  const isTransitioning = displayPath !== pathname;

  useLayoutEffect(() => {
    setDisplayPath(pathname);
  }, [pathname]);

  if (isTransitioning) {
    return <RouteFallback />;
  }

  return (
    <Suspense key={pathname} fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/features" element={<Features />} />
        <Route path="/accuracy" element={<Accuracy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/password/:shortCode" element={<PasswordProtected />} />

        {/* ── Authenticated App Shell with Single Socket Connection ── */}
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/editprofile" element={<Profile />} />
          <Route path="/dashboard/analytics" element={<AnalyticsDashboard />} />
          <Route
            path="/dashboard/preclick"
            element={
              <OwnerRoute>
                <PreClick />
              </OwnerRoute>
            }
          />
          <Route path="/dashboard/campaigns" element={<Campaigns />} />
          <Route path="/analytics/:id" element={<Analytics />} />
        </Route>

        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}
