import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import env from "../../Config/env";

/**
 * /password/:shortCode
 *
 * Where redirect.curtio.io sends visitors when a link is password protected.
 * On success the API returns the URL to continue to, carrying a short-lived
 * grant, so the normal loader → track → redirect flow takes over from there.
 */
export default function PasswordProtected() {
  const { shortCode } = useParams();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      setError("Please enter the password for this link.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${env.BACKEND_URL}/public/verify/${shortCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success && data.redirectUrl) {
        window.location.replace(data.redirectUrl);
        return;
      }

      if (res.status === 401) {
        setError(data.message || "Incorrect password. Please try again.");
        setPassword("");
      } else {
        // Link disabled, expired, or missing — a password will not help.
        setUnavailable(data.message || "This link is currently unavailable.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-8 font-bold text-2xl tracking-[-0.03em] text-slate-900"
          style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
        >
          curtio<span className="text-indigo-600">.</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-[16px] p-8 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)] text-center">
          {unavailable ? (
            <>
              <div className="w-16 h-16 mx-auto bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-slate-400" />
              </div>

              <h1 className="text-[1.5rem] font-extrabold text-slate-900 tracking-[-0.02em] mb-2">
                Link Unavailable
              </h1>
              <p className="text-slate-500 text-[0.95rem] leading-[1.6] mb-8">
                {unavailable}
              </p>

              <Link
                to="/"
                className="w-full flex items-center justify-center px-5 py-3 rounded-[12px] bg-indigo-600 text-white font-semibold text-[0.975rem] hover:bg-indigo-700 transition-colors"
              >
                Go to Curtio Homepage
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-indigo-600" />
              </div>

              <h1 className="text-[1.5rem] font-extrabold text-slate-900 tracking-[-0.02em] mb-2">
                This link is protected
              </h1>
              <p className="text-slate-500 text-[0.95rem] leading-[1.6] mb-7">
                Enter the password to continue to the destination.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-left">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                <div>
                  <label htmlFor="link-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />

                    <input
                      id="link-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      autoComplete="off"
                      placeholder="Enter password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-5 py-3 rounded-[12px] bg-indigo-600 text-white font-semibold text-[0.975rem] hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Checking…" : "Continue"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-slate-400 text-[0.82rem]">
          Powered by <span className="font-semibold text-slate-500">Curtio</span>
        </p>
      </div>
    </div>
  );
}
