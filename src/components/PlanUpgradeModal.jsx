import { X, Check } from "lucide-react";

const FREE_FEATURES = [
  "URL shortening",
  "Dashboard to manage links and campaigns",
  "QR code download (PNG)",
  "Click analytics (time, country, device, and referrer)",
  "Custom aliases",
  "UTM tags (source, medium)",
  "Link expiration",
  "1 campaign: group your link under a shared UTM campaign",
];

const PLUS_FEATURES = [
  "Unlimited tracked links",
  "Unlimited campaigns with combined click totals, active link counts, and channel breakdowns",
  "Every Free feature applied across your full link library instead of a single link",
];

// Keep this in sync with the published Pricing Plan copy (src/pages/Pricing.jsx).
export default function PlanUpgradeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade plan"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-5 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
          Upgrade your plan
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Free includes 1 link per user. Upgrade to Plus for unlimited links and campaigns.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="border-2 border-indigo-500 rounded-2xl p-5 flex flex-col">
            <div className="font-bold text-slate-900">Free</div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3 mb-3">
              $0
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                  <Check size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 w-full text-center px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm">
              Current Plan
            </div>
          </div>

          {/* Plus */}
          <div className="border border-slate-200 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-slate-900">Plus</div>
              <span className="inline-flex items-center whitespace-nowrap bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                Coming soon
              </span>
            </div>

            <div className="flex items-baseline gap-1 mt-3 mb-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">$10</span>
              <span className="text-slate-500 text-sm font-semibold">/month</span>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {PLUS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                  <Check size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-5 w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 font-semibold text-sm border border-slate-200 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-5">
          Paid checkout is currently not available. Plus subscriptions will become available once online payment processing has been enabled.
        </p>
      </div>
    </div>
  );
}
