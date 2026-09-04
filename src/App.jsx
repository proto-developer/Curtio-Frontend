import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerRoute from "./components/OwnerRoute";
import { RouteSeo } from "./components/Seo";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AnalytcsDashboard = lazy(() => import("./pages/AnalytcsDashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/Fpassword"));
const Accuracy = lazy(() => import("./pages/Accuracy"));
const Features = lazy(() => import("./pages/feature"));
const Pricing = lazy(() => import("./pages/Pricing"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const PasswordProtected = lazy(() => import("./pages/PasswordProtected"));
const PreClick = lazy(() => import("./pages/PreClick"));
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

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
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
              <SocketProvider>
                <Outlet />
              </SocketProvider>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/editprofile" element={<Profile />} />
          <Route path="/dashboard/analytics" element={<AnalytcsDashboard />} />
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
    </BrowserRouter>
  );
}
