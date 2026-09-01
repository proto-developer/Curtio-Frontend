import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-[1152px] px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="text-3xl font-bold tracking-[-0.03em] text-slate-900 font-space"
            >
              curtio<span className="text-indigo-600">.</span>
            </Link>

            <p className="mt-3 text-sm text-slate-500">
              Shorten. Share. Track.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Product
            </h4>

            <div className="space-y-2">
              <Link to="/features" className="block text-slate-700 transition hover:text-indigo-600">
                Features
              </Link>

              {/* <Link to="/pricing" className="block text-slate-700 transition hover:text-indigo-600">
                Pricing
              </Link> */}

              <Link to="/accuracy" className="block text-slate-700 transition hover:text-indigo-600">
                Accuracy
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Company
            </h4>

            <div className="space-y-2">
              <Link to="/blog" className="block text-slate-700 transition hover:text-indigo-600">
                Blog
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Legal
            </h4>

            <div className="space-y-2">
              <Link to="/privacy-policy" className="block text-slate-700 transition hover:text-indigo-600">
                Privacy
              </Link>

              <Link to="/terms-of-service" className="block text-slate-700 transition hover:text-indigo-600">
                Terms
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between text-center">
          <span>© 2026 curtio.io</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;