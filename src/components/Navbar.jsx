import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { isLoggedIn as hasActiveSession } from "../lib/session";

export default function Navbar() {
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getStoredUser = () => {
    const data =
      localStorage.getItem("LoginUser") || localStorage.getItem("user");

    if (!data || data === "undefined") return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const storedUser = getStoredUser();
  const isLoggedIn = hasActiveSession();
  const userInitial = storedUser?.name?.charAt(0).toUpperCase() || "";

  const navItems = [
    { to: "/features", label: "Features" },
    // { to: "/pricing", label: "Pricing" },
    { to: "/accuracy", label: "Accuracy" },
    { to: "/blog", label: "Blog" },
  ];

  const isActive = (path) => {
    if (path.startsWith("/#")) {
      return (
        location.pathname === "/" &&
        location.hash === path.replace("/", "")
      );
    }

    return location.pathname === path;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-[14px] transition-colors duration-300 ${scrolled
        ? "bg-white/80 border-b border-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
        : "bg-[#FAFAFA]/70 border-b border-transparent"
        }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <div className="max-w-[1152px] mx-auto px-6 flex items-center gap-4 h-[68px] relative">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-2xl tracking-[-0.03em] text-slate-900 shrink-0"
          style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
        >
          curtio<span className="text-indigo-600">.</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1.5 min-w-0">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`font-medium text-[0.95rem] px-3.5 py-2 rounded-[10px] transition-all ${isActive(item.to)
                ? "text-slate-900 bg-slate-900/[.04]"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/[.04]"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard/analytics"
                className="font-semibold text-[0.975rem] px-4 py-3 rounded-xl text-slate-700 hover:text-slate-900 transition"
              >
                Dashboard
              </Link>

              <Link
                to="/dashboard"
                className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center"
              >
                {userInitial}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-semibold text-[0.975rem] px-4 py-3 rounded-xl text-slate-700 hover:text-slate-900 transition"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="font-semibold text-[0.975rem] px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Get started free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden ml-auto border border-slate-200 rounded-lg p-2"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden flex flex-col gap-1 px-6 py-4 border-t border-slate-200 bg-white">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-3 rounded-lg font-medium transition ${isActive(item.to)
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
            >
              {item.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <Link
              to="/dashboard/analytics"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-3 py-3 rounded-lg font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-3 py-3 rounded-lg font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-3 py-3 rounded-xl bg-indigo-600 text-white text-center font-semibold hover:bg-indigo-700"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}