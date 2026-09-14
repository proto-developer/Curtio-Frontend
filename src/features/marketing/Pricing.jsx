import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPlan } from "@/api/plan";
import { isSubscriptionExpired } from "@/lib/auth/premium";
import { isOwner } from "@/lib/auth/owner";

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */
const TABLE_ROWS = [
  ["Price", "$0", "$0", "$9/mo ($7 annual)"],
  ["Account needed", "No", "Yes", "Yes"],
  ["Short links", "5 / day", "Unlimited*", "Unlimited*"],
  ["Tracked links", "None", "1", "25"],
  ["Accurate analytics", "None", "Full", "Full"],
  ["QR codes", "Yes", "Yes", "Yes"],
  ["Custom alias", "None", "Yes", "Yes"],
  ["UTM builder", "None", "Yes", "Yes"],
  ["Password and expiry", "None", "Yes", "Yes"],
  ["Analytics history", "None", "Standard", "Extended"],
  ["Bulk creation", "None", "None", "Yes"],
  ["Custom branded domain", "None", "None", "Yes"],
  ["API access", "None", "None", "Yes"],
  ["Priority support", "None", "None", "Yes"],
];

const FAQ_ITEMS = [
  {
    q: "Is the Free plan really free?",
    a: "Yes, and it stays free. No credit card, no trial timer. You get one fully tracked link with complete, accurate analytics for as long as you want it.",
  },
  {
    q: "What is the difference between Free and Plus?",
    a: "Free gives you one tracked link with all the standard features. Plus, at $9 a month, gives you 25 tracked links plus the premium tools: a custom branded domain, bulk creation, API access, longer analytics history, and priority support.",
  },
  {
    q: 'What does "accurate" actually mean?',
    a: "We count each real visitor once, so a bot or a link preview will not inflate your numbers. That holds on Free and Plus alike.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel whenever you like and you keep Plus until the end of your billing period, then you drop back to Free. Your links and your data stay intact.",
  },
  {
    q: "Is annual cheaper?",
    a: "Yes. Annual billing works out to $7 a month, or $84 a year, which saves you 22% against monthly.",
  },
  {
    q: "Will you put ads on my links?",
    a: "No. Your redirect goes straight to the destination, and it is fast, on every plan including Free. We do not run ads on your links.",
  },
  {
    q: "Do you sell my data?",
    a: "No. We hash IP addresses and never store raw visitor data. Your data is yours.",
  },
  {
    q: "How does curtio compare to Bitly or Cuttly on price?",
    a: "Both lock real analytics behind paid tiers and have raised prices over the years. curtio gives you accurate analytics on the free tier, and Plus stays low at $9 a month, or $7 on annual billing.",
  },
];

/* ─────────────────────────────────────────────────────────────
   SMALL REUSABLE SVGs
───────────────────────────────────────────────────────────── */
const CheckIcon = ({ className = "" }) => (
  <svg
    className={`w-[18px] h-[18px] flex-none text-indigo-600 ${className}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const XIcon = () => (
  <svg
    className="w-[18px] h-[18px] flex-none text-slate-300"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="m12 2 2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.86-5-4.87 7.1-1.01z" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-5 h-5 flex-none text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-indigo-600" : ""}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/* Render a table cell value */
function TableCell({ val, plus }) {
  if (val === "Yes") return <div className="flex justify-center"><CheckIcon className={plus ? "text-indigo-600" : "text-indigo-500"} /></div>;
  if (val === "None" || val === "No") return <div className="flex justify-center"><XIcon /></div>;
  return <span className="text-[0.93rem] text-slate-700">{val}</span>;
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const apiToken = localStorage.getItem("apiToken");
  const isLoggedIn = !!apiToken;

  // `null` until the plan endpoint answers, so a Plus subscriber never
  // flashes the "Coming soon" badge as their own current plan.
  const [plan, setPlan] = useState(null);
  const planLoaded = !isLoggedIn || plan !== null;

  useEffect(() => {
    if (!apiToken) return;

    let cancelled = false;
    getPlan({ token: apiToken })
      .then((data) => {
        if (!cancelled && data?.success) setPlan(data);
      })
      .catch(() => {
        /* Leave the plan unknown rather than guessing. */
      });

    return () => {
      cancelled = true;
    };
  }, [apiToken]);

  // Owners run the tool and are never billed — they have no reason to see
  // pricing, so a direct visit to /pricing sends them to their dashboard.
  if (isOwner()) return <Navigate to="/dashboard" replace />;

  const isPlusActive =
    planLoaded && !!plan?.unlimitedLinks && !isSubscriptionExpired(plan.subscriptionStatus);
  const isFreeCurrent = isLoggedIn && planLoaded && !isPlusActive;

  return (
    <>
      <Navbar />

      <main id="main" className="overflow-x-hidden">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-36 pb-12 sm:pb-16 text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-[-160px] -translate-x-1/2 w-[520px] sm:w-[760px] h-[380px] sm:h-[520px] max-w-full rounded-full opacity-[.16]"
            style={{ background: "linear-gradient(120deg,#1E1B4B,#312E81 45%,#4F46E5)", filter: "blur(120px)" }}
          />

          <div className="relative z-10 max-w-[1152px] mx-auto px-5 sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 sm:px-4 py-1.5 text-xs md:text-sm font-semibold text-indigo-600">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
              Pricing
            </span>

            <h1 className="mt-5 sm:mt-6 text-[clamp(1.95rem,8vw,3.6rem)] font-extrabold tracking-[-0.035em] text-slate-900 leading-[1.12] mb-3 sm:mb-4">
              Pricing Plan
            </h1>

            <p className="text-slate-400 text-[0.8rem] sm:text-[0.875rem] mb-5 sm:mb-6">
              Last updated:{" "}
              <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
            </p>

            <p className="text-[0.95rem] sm:text-base md:text-lg text-slate-500 max-w-md sm:max-w-[64ch] mx-auto leading-relaxed text-justify sm:text-center">
              {INTRO}
            </p>
          </div>
        </section>

        {/* ── PLANS ──────────────────────────────────────────── */}
        <section className="pb-14 sm:pb-20" id="plans">
          <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
            <div className="grid md:grid-cols-2 gap-5 sm:gap-6 items-stretch max-w-[1080px] mx-auto">

              {/* Free — highlighted by default (it's the plan you can actually buy
                  today), unless the signed-in user is an active Plus subscriber,
                  in which case the highlight moves to their real current plan. */}
              <article
                className={`relative bg-white rounded-2xl p-6 sm:p-8 flex flex-col transition-all hover:-translate-y-1 ${
                  isPlusActive
                    ? "border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,.07)] hover:shadow-[0_16px_38px_-10px_rgba(15,23,42,.20)]"
                    : "border-2 border-indigo-500 shadow-[0_24px_60px_-18px_rgba(79,70,229,0.4)] hover:shadow-[0_32px_70px_-18px_rgba(79,70,229,0.45)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-lg sm:text-[1.2rem] text-slate-900 tracking-[-0.01em]">Free</h2>
                  {isFreeCurrent && (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-indigo-50 text-indigo-700 text-[0.72rem] font-bold tracking-[0.02em] px-3 py-[5px] rounded-full">
                      Current Plan
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mt-4 sm:mt-5 mb-3 sm:mb-4 flex-wrap">
                  <span className="text-4xl sm:text-[2.7rem] font-extrabold tracking-[-0.035em] text-slate-900 leading-none">$0</span>
                </div>

                <p className="text-slate-600 text-[0.95rem] leading-[1.6]">
                  {FREE_SUMMARY}
                </p>

                <ul className="mt-5 sm:mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3 flex-1">
                  <li className="text-[0.82rem] font-semibold text-slate-400 uppercase tracking-wide">
                    Includes:
                  </li>
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.9rem] sm:text-[0.92rem] text-slate-700 leading-[1.5]">
                      <CheckIcon /><span>{f}</span>
                    </li>
                  ))}
                </ul>

                {!isLoggedIn ? (
                  <Link
                    to="/register"
                    className="mt-7 sm:mt-8 w-full flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-[0.95rem] sm:text-[0.975rem] hover:bg-indigo-700 hover:-translate-y-px transition-all shadow-[0_1px_3px_rgba(0,0,0,.07)]"
                  >
                    Get Started Free
                  </Link>
                ) : isFreeCurrent ? (
                  <Link
                    to="/dashboard"
                    className="mt-7 sm:mt-8 w-full flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-[0.95rem] sm:text-[0.975rem] hover:bg-indigo-700 hover:-translate-y-px transition-all shadow-[0_1px_3px_rgba(0,0,0,.07)]"
                  >
                    Continue to Dashboard
                  </Link>
                ) : null}
              </article>

              {/* Plus — deliberately understated while checkout is unavailable,
                  but highlighted like Free once the user is actually subscribed. */}
              <article
                className={`relative bg-white rounded-2xl p-6 sm:p-8 flex flex-col transition-all hover:-translate-y-1 ${
                  isPlusActive
                    ? "border-2 border-indigo-500 shadow-[0_24px_60px_-18px_rgba(79,70,229,0.4)] hover:shadow-[0_32px_70px_-18px_rgba(79,70,229,0.45)]"
                    : "border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,.07)] hover:shadow-[0_16px_38px_-10px_rgba(15,23,42,.20)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-lg sm:text-[1.2rem] text-slate-900 tracking-[-0.01em]">Plus</h2>
                  {isPlusActive ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-indigo-50 text-indigo-700 text-[0.72rem] font-bold tracking-[0.02em] px-3 py-[5px] rounded-full">
                      Current Plan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-amber-50 text-amber-700 text-[0.72rem] font-bold tracking-[0.02em] px-3 py-[5px] rounded-full">
                      Coming soon
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mt-4 sm:mt-5 mb-3 sm:mb-4 flex-wrap">
                  <span className="text-4xl sm:text-[2.7rem] font-extrabold tracking-[-0.035em] text-slate-900 leading-none">$10</span>
                  <span className="text-slate-500 font-semibold text-[1rem]">/month</span>
                </div>

                <p className="text-slate-600 text-[0.95rem] leading-[1.6]">
                  {PLUS_PRICE}
                </p>
                <p className="text-slate-600 text-[0.95rem] leading-[1.6] mt-3">
                  {PLUS_SUMMARY}
                </p>

                <ul className="mt-5 sm:mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3 flex-1">
                  {PLUS_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.9rem] sm:text-[0.92rem] text-slate-700 leading-[1.5]">
                      <CheckIcon /><span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isPlusActive ? (
                  <Link
                    to="/dashboard"
                    className="mt-7 sm:mt-8 w-full flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-[0.95rem] sm:text-[0.975rem] hover:bg-indigo-700 hover:-translate-y-px transition-all shadow-[0_1px_3px_rgba(0,0,0,.07)]"
                  >
                    Continue to Dashboard
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="mt-7 sm:mt-8 w-full flex items-center justify-center text-center px-5 py-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-[0.95rem] sm:text-[0.975rem] border border-slate-200 cursor-not-allowed"
                  >
                    {PLUS_CTA}
                  </button>
                )}
              </article>
            </div>
          </div>
        </div>
      </section>

        {/* ── COMPARISON ─────────────────────────────────────── */}
        <section className="py-14 sm:py-20 border-t border-slate-100">
          <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
            <div className="max-w-[680px] mx-auto text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
                Free and Plus side by side
              </h2>
              <p className="text-[0.95rem] sm:text-base md:text-lg text-slate-500 leading-relaxed">
                Both plans use the same tools. The difference is how many links and campaigns you can run them across.
              </p>
            </div>

            {/* Mobile & tablet: stacked cards, no horizontal scroll */}
            <div className="lg:hidden space-y-3 max-w-[520px] mx-auto">
              {TABLE_ROWS.map(([label, free, plus]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-sm">
                    {label}
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-100 text-center">
                    <div className="px-3 py-3">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 mb-1">Free</div>
                      <div className="flex justify-center text-[0.9rem] text-slate-700"><TableCell val={free} /></div>
                    </div>
                    <div className="px-3 py-3 bg-indigo-50/50">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-indigo-500 mb-1">Plus</div>
                      <div className="flex justify-center text-[0.9rem] text-slate-900"><TableCell val={plus} plus /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: full comparison table */}
            <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-2xl shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)] bg-white max-w-[1000px] mx-auto">
              <table className="w-full border-collapse min-w-[660px]">
                <caption className="sr-only">Comparison of the Free and Plus plans</caption>
                <thead>
                  <tr>
                    <th scope="col" className="text-left py-6 px-5 text-[1.05rem] font-bold text-slate-900 w-[44%]">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th scope="col" className="text-center py-6 px-5 text-[1.05rem] font-bold text-slate-900 w-[28%]">Free</th>
                    <th scope="col" className="text-center py-6 px-5 text-[1.05rem] font-bold text-indigo-700 bg-indigo-50 rounded-tr-2xl w-[28%]">Plus</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map(([label, free, plus]) => (
                    <tr key={label} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <th scope="row" className="py-[15px] px-5 text-left font-semibold text-[0.93rem] text-slate-900 w-[44%]">{label}</th>
                      <td className="py-[15px] px-5 text-center w-[28%]"><TableCell val={free} /></td>
                      <td className="py-[15px] px-5 text-center bg-indigo-50/60 w-[28%]"><TableCell val={plus} plus /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── BILLING ────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 border-t border-slate-100" id="billing">
          <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
            <div className="max-w-[780px] mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6 sm:mb-8 text-center">
                Billing
              </h2>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] flex flex-col gap-4">
                {BILLING_POINTS.map((point) => (
                  <p key={point} className="text-slate-600 text-[0.95rem] sm:text-base leading-[1.7]">
                    {point}
                  </p>
                ))}

                <p className="text-slate-600 text-[0.95rem] sm:text-base leading-[1.7]">
                  For more information, see our{" "}
                  <Link
                    to="/refund-policy"
                    className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                  >
                    Refund &amp; Return Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/terms-of-service"
                    className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>
              </div>
              <p className="text-slate-500 text-[0.85rem] min-h-[20px]">No account</p>
              <Link
                to="/"
                className="mt-6 w-full flex items-center justify-center px-5 py-3 rounded-[12px] border border-slate-200 text-slate-700 font-semibold text-[0.975rem] hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                Shorten a link
              </Link>
              <ul className="mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3 flex-1">
                {["5 short links per day", "Instant QR code on every link", "Fast, ad-free redirects", "No sign-up, no tracking"].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[0.92rem] text-slate-700 leading-[1.45]">
                    <CheckIcon /><span>{f}</span>
                  </li>
                ))}
              </ul>
            </article> */}

            {/* Free */}
            <article className="bg-white border border-slate-200 rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] flex flex-col transition-all hover:shadow-[0_16px_38px_-10px_rgba(15,23,42,.20)] hover:-translate-y-1">
              <div className="font-bold text-[1.2rem] text-slate-900 tracking-[-0.01em]">Free</div>
              <p className="text-slate-500 text-[0.92rem] mt-1.5 leading-[1.45] min-h-[40px]">For people who live by their numbers.</p>
              <div className="flex items-baseline gap-1.5 mt-6 mb-1 flex-wrap">
                <span className="text-[2.7rem] font-extrabold tracking-[-0.035em] text-slate-900 leading-none">$0</span>
              </div>
              <p className="text-slate-500 text-[0.85rem] min-h-[20px]">Free, and it stays free</p>
              <Link
                to="/register"
                className="mt-6 w-full flex items-center justify-center px-5 py-3 rounded-[12px] border border-slate-200 text-slate-700 font-semibold text-[0.975rem] hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                Get started free
              </Link>
              <ul className="mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3 flex-1">
                <li className="text-[0.82rem] font-semibold text-slate-400 uppercase tracking-wide">Everything in Guest, plus:</li>
                {["1 fully tracked link", "Accurate click analytics, counted once", "Clicks by time, device, country, and referrer", "Custom alias", "UTM builder", "Password protection and link expiration", "QR code downloads", "No credit card"].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[0.92rem] text-slate-700 leading-[1.45]">
                    <CheckIcon /><span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* Plus — featured */}
            <article className="relative bg-white border-2 border-indigo-500 rounded-[16px] p-8 pt-10 shadow-[0_24px_60px_-18px_rgba(79,70,229,0.4)] flex flex-col transition-all hover:shadow-[0_32px_70px_-18px_rgba(79,70,229,0.45)] hover:-translate-y-1">
              {/* Most popular badge */}
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 whitespace-nowrap bg-indigo-600 text-white text-[0.75rem] font-bold tracking-[0.02em] px-4 py-[7px] rounded-full shadow-[0_10px_22px_-6px_rgba(79,70,229,0.6)]">
                <StarIcon /> Most popular
              </span>
              <div className="font-bold text-[1.2rem] text-slate-900 tracking-[-0.01em]">Plus</div>
              <p className="text-slate-500 text-[0.92rem] mt-1.5 leading-[1.45] min-h-[40px]">For creators and marketers running real campaigns.</p>
              <div className="flex items-baseline gap-1.5 mt-6 mb-1 flex-wrap">
                <span className="text-[2.7rem] font-extrabold tracking-[-0.035em] text-slate-900 leading-none">{plusPrice}</span>
                <span className="text-slate-500 font-semibold text-[1rem]">/mo</span>
              </div>
              <p className="text-slate-500 text-[0.85rem] min-h-[20px]">{plusNote}</p>
              <Link
                to="/register"
                className="mt-6 w-full flex items-center justify-center px-5 py-3 rounded-[12px] bg-indigo-600 text-white font-semibold text-[0.975rem] hover:bg-indigo-700 hover:-translate-y-px transition-all shadow-[0_1px_3px_rgba(0,0,0,.07)]"
              >
                Upgrade to Plus
              </Link>
              <ul className="mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3 flex-1">
                <li className="text-[0.82rem] font-semibold text-slate-400 uppercase tracking-wide">Everything in Free, plus:</li>
                {["25 tracked links", "Longer analytics history", "Bulk link creation", "Custom branded domain", "API access", "Priority support"].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[0.92rem] text-slate-700 leading-[1.45]">
                    <CheckIcon /><span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 border-t border-slate-100">
          <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
            <div className="max-w-[680px] mx-auto text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Plan details, answered straight
              </h2>
            </div>

            <div className="max-w-[780px] mx-auto flex flex-col gap-3">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={item.q}
                    className={`bg-white border rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.07)] transition-all ${isOpen ? "border-slate-300 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)]" : "border-slate-200"
                      }`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left font-semibold text-[0.95rem] sm:text-[1.05rem] text-slate-900 bg-transparent border-none cursor-pointer"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                    >
                      <span>{item.q}</span>
                      <ChevronIcon open={isOpen} />
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{ maxHeight: isOpen ? "460px" : "0" }}
                    >
                      <div className="px-5 sm:px-6 pb-5 text-slate-500 text-[0.92rem] sm:text-[0.98rem] leading-[1.65]">
                        {item.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── QUESTIONS / CONTACT ────────────────────────────── */}
        <section className="py-14 sm:py-20 border-t border-slate-100" id="questions">
          <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
            <div className="max-w-[780px] mx-auto text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
                Questions
              </h2>
              <p className="text-[0.95rem] sm:text-base md:text-lg text-slate-500">
                For questions about Curtio plans or billing, contact:
              </p>
            </div>

            <dl className="max-w-[780px] mx-auto bg-white border border-slate-200 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,.07)] divide-y divide-slate-100">
              {CONTACT_ROWS.map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row gap-1 sm:gap-6 px-5 sm:px-7 py-4 sm:py-5">
                  <dt className="text-[0.9rem] font-semibold text-slate-900 sm:w-[170px] shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-[0.95rem] sm:text-[0.98rem] text-slate-600 leading-[1.6] break-words">
                    {row.href ? (
                      <a href={row.href} className="font-semibold text-indigo-600 hover:text-indigo-700">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <CTASection
        heading="Start free. Pay only when you need more."
        description="Make a free account in 30 seconds. One fully tracked link with complete analytics, forever free."
        buttonText="Get started free"
        buttonLink="/register"
      />
      </main>

      <Footer />
    </>
  );
}