import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

/* ─────────────────────────────────────────────────────────────
   PLAN CONTENT — single source of truth for this page.
   Keep in sync with the published Pricing Plan copy; every other
   surface that quotes a price or a limit should match this file.
───────────────────────────────────────────────────────────── */
export const LAST_UPDATED = "August 28, 2026";
export const LAST_UPDATED_ISO = "2026-08-28";

const INTRO =
  "Curtio provides URL shortening, link management, QR codes, and analytics tools for individuals, creators, marketers, and businesses.";

const FREE_SUMMARY =
  "Free includes 1 link per user. If you need more than 1 link, you must upgrade to a paid plan.";

const FREE_FEATURES = [
  "URL shortening",
  "Dashboard to manage links and campaigns",
  "QR code download (PNG)",
  "Click analytics (time, country, device, and referrer)",
  "Custom aliases",
  "UTM tags (source, medium)",
  "Link expiration",
  "1 campaign: group your link under a shared UTM campaign so you can track it alongside other channels promoting the same destination",
];

const PLUS_PRICE = "$10/month, or $96/year when billed annually (20% off).";

const PLUS_SUMMARY =
  "Required if you need more than 1 link. Includes everything in Free, plus:";

const PLUS_FEATURES = [
  "Unlimited tracked links",
  "Unlimited campaigns: group any number of links under as many shared UTM campaigns as you need, with combined click totals, active link counts, and channel breakdowns per campaign",
  "Every Free feature (QR codes, click analytics, custom aliases, UTM tags, link expiration) applied across your full link library instead of a single link",
];

const PLUS_CTA = "Coming Soon";

const CHECKOUT_NOTICE =
  "Paid checkout is currently not available. Plus subscriptions will become available once online payment processing has been enabled.";

const BILLING_POINTS = [
  "When paid subscriptions become available, the applicable price, billing interval, and renewal terms will be shown before purchase.",
  "Subscriptions may be canceled according to Curtio's subscription terms.",
];

const CONTACT_ROWS = [
  { label: "Email", value: "support@curtio.io", href: "mailto:support@curtio.io" },
  { label: "Company", value: "Proto IT Consultants" },
  {
    label: "Pakistan Office",
    value: "Plot 35A Street 2, Jammu & Kashmir Housing Society G 15/1 G-15, Islamabad, 44150",
  },
  { label: "Phone", value: "+92 334 5868874", href: "tel:+923345868874" },
];

/* Comparison rows are derived strictly from the plan copy above. */
const TABLE_ROWS = [
  ["Price", "$0", "$10/month ($96/year)"],
  ["Tracked links", "1", "Unlimited"],
  ["Campaigns", "1", "Unlimited"],
  ["URL shortening", "Yes", "Yes"],
  ["Dashboard to manage links and campaigns", "Yes", "Yes"],
  ["QR code download (PNG)", "Yes", "Yes"],
  ["Click analytics (time, country, device, and referrer)", "Yes", "Yes"],
  ["Custom aliases", "Yes", "Yes"],
  ["UTM tags (source, medium)", "Yes", "Yes"],
  ["Link expiration", "Yes", "Yes"],
  ["Combined click totals and channel breakdown per campaign", "Your 1 link", "Full link library"],
  ["Available today", "Yes", "Coming soon"],
];

const FAQ_ITEMS = [
  {
    q: "What does the Free plan include?",
    a: `${FREE_SUMMARY} It includes URL shortening, a dashboard to manage links and campaigns, QR code download (PNG), click analytics (time, country, device, and referrer), custom aliases, UTM tags (source, medium), link expiration, and 1 campaign.`,
  },
  {
    q: "When do I need to upgrade?",
    a: "Free includes 1 link per user. If you need more than 1 link, you must upgrade to a paid plan. Plus is the paid plan and it is required once you go past that single link.",
  },
  {
    q: "How much does Plus cost?",
    a: "Plus is $10/month, or $96/year when billed annually, which is 20% off the monthly price.",
  },
  {
    q: "Can I subscribe to Plus today?",
    a: CHECKOUT_NOTICE,
  },
  {
    q: "What is a campaign?",
    a: "A campaign groups your link under a shared UTM campaign so you can track it alongside other channels promoting the same destination. Free includes 1 campaign. Plus includes unlimited campaigns, with combined click totals, active link counts, and channel breakdowns per campaign.",
  },
  {
    q: "What changes about the features when I upgrade?",
    a: "Nothing is taken away and nothing new has to be learned. Every Free feature (QR codes, click analytics, custom aliases, UTM tags, link expiration) applies across your full link library instead of a single link.",
  },
  {
    q: "How will billing work?",
    a: `${BILLING_POINTS[0]} ${BILLING_POINTS[1]}`,
  },
  {
    q: "Who do I contact about plans or billing?",
    a: "For questions about Curtio plans or billing, contact support@curtio.io. Curtio is operated by Proto IT Consultants.",
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
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const XIcon = () => (
  <svg
    className="w-[18px] h-[18px] flex-none text-slate-300"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-5 h-5 flex-none text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-indigo-600" : ""}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/* Render a table cell value */
function TableCell({ val, plus }) {
  if (val === "Yes") {
    return (
      <div className="flex justify-center">
        <span className="sr-only">Included</span>
        <CheckIcon className={plus ? "text-indigo-600" : "text-indigo-500"} />
      </div>
    );
  }
  if (val === "None" || val === "No") {
    return (
      <div className="flex justify-center">
        <span className="sr-only">Not included</span>
        <XIcon />
      </div>
    );
  }
  return <span className="text-[0.93rem] text-slate-700">{val}</span>;
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function Pricing() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <>
      <Navbar />

      <main id="main">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-[152px] pb-[56px] text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-[-160px] -translate-x-1/2 w-[760px] h-[520px] rounded-full opacity-[.16]"
            style={{ background: "linear-gradient(120deg,#1E1B4B,#312E81 45%,#4F46E5)", filter: "blur(120px)" }}
          />

          <div className="relative z-10 max-w-[1152px] mx-auto px-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-[7px] text-[0.8rem] font-semibold text-indigo-600">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 block" />
              Pricing
            </span>

            <h1 className="mt-6 text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold tracking-[-0.035em] text-slate-900 leading-[1.12] mb-4">
              Pricing Plan
            </h1>

            <p className="text-slate-400 text-[0.875rem] mb-6">
              Last updated:{" "}
              <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
            </p>

            <p className="text-[1.225rem] text-slate-500 max-w-[64ch] mx-auto leading-relaxed">
              {INTRO}
            </p>
          </div>
        </section>

        {/* ── PLANS ──────────────────────────────────────────── */}
        <section className="pb-20" id="plans">
          <div className="max-w-[1152px] mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-[1080px] mx-auto">

              {/* Free */}
              <article className="bg-white border border-slate-200 rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] flex flex-col transition-all hover:shadow-[0_16px_38px_-10px_rgba(15,23,42,.20)] hover:-translate-y-1">
                <h2 className="font-bold text-[1.2rem] text-slate-900 tracking-[-0.01em]">Free</h2>

                <div className="flex items-baseline gap-1.5 mt-5 mb-4 flex-wrap">
                  <span className="text-[2.7rem] font-extrabold tracking-[-0.035em] text-slate-900 leading-none">$0</span>
                </div>

                <p className="text-slate-600 text-[0.95rem] leading-[1.6]">
                  {FREE_SUMMARY}
                </p>

                <ul className="mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3 flex-1">
                  <li className="text-[0.82rem] font-semibold text-slate-400 uppercase tracking-wide">
                    Includes:
                  </li>
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.92rem] text-slate-700 leading-[1.5]">
                      <CheckIcon /><span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className="mt-8 w-full flex items-center justify-center px-5 py-3 rounded-[12px] bg-indigo-600 text-white font-semibold text-[0.975rem] hover:bg-indigo-700 hover:-translate-y-px transition-all shadow-[0_1px_3px_rgba(0,0,0,.07)]"
                >
                  Get Started Free
                </Link>
              </article>

              {/* Plus */}
              <article className="relative bg-white border-2 border-indigo-500 rounded-[16px] p-8 shadow-[0_24px_60px_-18px_rgba(79,70,229,0.4)] flex flex-col transition-all hover:shadow-[0_32px_70px_-18px_rgba(79,70,229,0.45)] hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-[1.2rem] text-slate-900 tracking-[-0.01em]">Plus</h2>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-amber-50 text-amber-700 text-[0.72rem] font-bold tracking-[0.02em] px-3 py-[5px] rounded-full">
                    Coming soon
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mt-5 mb-4 flex-wrap">
                  <span className="text-[2.7rem] font-extrabold tracking-[-0.035em] text-slate-900 leading-none">$10</span>
                  <span className="text-slate-500 font-semibold text-[1rem]">/month</span>
                </div>

                <p className="text-slate-600 text-[0.95rem] leading-[1.6]">
                  {PLUS_PRICE}
                </p>
                <p className="text-slate-600 text-[0.95rem] leading-[1.6] mt-3">
                  {PLUS_SUMMARY}
                </p>

                <ul className="mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3 flex-1">
                  {PLUS_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.92rem] text-slate-700 leading-[1.5]">
                      <CheckIcon /><span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="mt-8 w-full flex items-center justify-center text-center px-5 py-3 rounded-[12px] bg-slate-100 text-slate-500 font-semibold text-[0.975rem] border border-slate-200 cursor-not-allowed"
                >
                  {PLUS_CTA}
                </button>
              </article>
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ───────────────────────────────── */}
        <section className="py-20 border-t border-slate-100">
          <div className="max-w-[1152px] mx-auto px-6">
            <div className="max-w-[680px] mx-auto text-center mb-14">
              <h2 className="text-[clamp(2rem,3.6vw,2.6rem)] font-extrabold text-slate-900 tracking-tight mb-4">
                Free and Plus side by side
              </h2>
              <p className="text-[1.125rem] text-slate-500">
                Both plans use the same tools. The difference is how many links and campaigns you can run them across.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-[24px] shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)] bg-white max-w-[1000px] mx-auto">
              <table className="w-full border-collapse min-w-[660px]">
                <caption className="sr-only">Comparison of the Free and Plus plans</caption>
                <thead>
                  <tr>
                    <th scope="col" className="text-left py-6 px-5 text-[1.05rem] font-bold text-slate-900 w-[44%]">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th scope="col" className="text-center py-6 px-5 text-[1.05rem] font-bold text-slate-900 w-[28%]">Free</th>
                    <th scope="col" className="text-center py-6 px-5 text-[1.05rem] font-bold text-indigo-700 bg-indigo-50 rounded-tr-[24px] w-[28%]">Plus</th>
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
        <section className="py-20 border-t border-slate-100" id="billing">
          <div className="max-w-[1152px] mx-auto px-6">
            <div className="max-w-[780px] mx-auto">
              <h2 className="text-[clamp(2rem,3.6vw,2.6rem)] font-extrabold text-slate-900 tracking-tight mb-8 text-center">
                Billing
              </h2>

              <div className="bg-white border border-slate-200 rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] flex flex-col gap-4">
                {BILLING_POINTS.map((point) => (
                  <p key={point} className="text-slate-600 text-[1rem] leading-[1.7]">
                    {point}
                  </p>
                ))}

                <p className="text-slate-600 text-[1rem] leading-[1.7]">
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
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section className="py-20 border-t border-slate-100">
          <div className="max-w-[1152px] mx-auto px-6">
            <div className="max-w-[680px] mx-auto text-center mb-14">
              <h2 className="text-[clamp(2rem,3.6vw,2.6rem)] font-extrabold text-slate-900 tracking-tight">
                Plan details, answered straight
              </h2>
            </div>

            <div className="max-w-[780px] mx-auto flex flex-col gap-3">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={item.q}
                    className={`bg-white border rounded-[16px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.07)] transition-all ${isOpen ? "border-slate-300 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)]" : "border-slate-200"
                      }`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-[1.05rem] text-slate-900 bg-transparent border-none cursor-pointer"
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
                      <div className="px-6 pb-5 text-slate-500 text-[0.98rem] leading-[1.65]">
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
        <section className="py-20 border-t border-slate-100" id="questions">
          <div className="max-w-[1152px] mx-auto px-6">
            <div className="max-w-[780px] mx-auto text-center mb-10">
              <h2 className="text-[clamp(2rem,3.6vw,2.6rem)] font-extrabold text-slate-900 tracking-tight mb-4">
                Questions
              </h2>
              <p className="text-[1.125rem] text-slate-500">
                For questions about Curtio plans or billing, contact:
              </p>
            </div>

            <dl className="max-w-[780px] mx-auto bg-white border border-slate-200 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,.07)] divide-y divide-slate-100">
              {CONTACT_ROWS.map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row gap-1 sm:gap-6 px-7 py-5">
                  <dt className="text-[0.9rem] font-semibold text-slate-900 sm:w-[170px] shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-[0.98rem] text-slate-600 leading-[1.6]">
                    {row.href ? (
                      <a href={row.href} className="font-semibold text-indigo-600 hover:text-indigo-700">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
