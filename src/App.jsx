import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import AnalytcsDashboard from "./pages/AnalytcsDashboard";
import Campaigns from "./pages/Campaigns";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/Fpassword";
import Accuracy from "./pages/Accuracy";
import Features from "./pages/feature";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import PasswordProtected from "./pages/PasswordProtected";
import PreClick from "./pages/PreClick";
import OwnerRoute from "./components/OwnerRoute";
import SocketProvider from "./socket/SocketProvider";
import { RouteSeo } from "./components/Seo";

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
    </BrowserRouter>
  );
}
