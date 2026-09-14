import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { syncPendingUrl } from "@/lib/sync";
import { login, googleLogin } from "@/api/auth";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGoogleLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        setLoading(true);
        setError("");
        try {
          const data = await googleLogin(tokenResponse.access_token);
          if (!data.success) {
            setError(data.message);
          } else {
            localStorage.setItem("apiToken", data.apiToken);
            localStorage.setItem("LoginUser", JSON.stringify(data.LoginUser));
            await syncPendingUrl(data.apiToken);
            navigate("/dashboard/analytics");
          }
        } catch {
          setError("Network error during Google login.");
        } finally {
          setLoading(false);
        }
      },
      onError: () => setError("Google Sign-In failed.")
    });

    async function handleSubmit(e) {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const data = await login(email, password);
        if (!data.success) {
          setError(data.message);
        } else {
          localStorage.setItem("apiToken", data.apiToken);
          localStorage.setItem("LoginUser", JSON.stringify(data.LoginUser));
          await syncPendingUrl(data.apiToken);
          navigate("/dashboard");
        }
      } catch {
        setError("Network error. Is the server running?");
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="min-h-screen bg-slate-50 flex">
        {/* Left panel - branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400 opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl" />
          </div>
          <Link
          to="/"
          className="font-bold text-2xl tracking-[-0.03em] text-white"
          style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
        >
          Curtio<span className="text-white">.</span>
        </Link>
          <div className="relative">
            <blockquote className="text-white/90 text-2xl font-semibold leading-snug mb-4">
              "Curtio cut our link management time in half. The analytics are incredible."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Sarah Chen</div>
                <div className="text-indigo-300 text-sm">Head of Growth, Stackly</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link to="/" className="flex lg:hidden items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" fill="white" />
              </div>
              <span className="text-xl font-extrabold text-slate-900">Curtio</span>
            </Link>

            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-slate-500 mb-8">Sign in to your Curtio account.</p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <Link to="/forgot-password" type="button" className="text-sm text-indigo-600 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 cursor-pointer hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : "Sign In"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 px-3 text-xs text-slate-400 font-medium">OR CONTINUE WITH</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={loading}
              className="w-full border border-slate-200 cursor-pointer bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31.8 33.5C29.9 34.8 27.1 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.5 39.8 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.1 5.3l5.7 4.5C40.4 34.7 44 29.8 44 24c0-1.3-.2-2.7-.4-4z" />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
