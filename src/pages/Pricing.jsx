import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import CTASection from "../components/cta";

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

  const plusPrice = annual ? "$7" : "$9";
  const plusNote = annual ? "Billed $84 a year" : "Save 22% with annual billing";

  return (
    <>
      <Navbar />

      <main id="main">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[152px] pb-[56px] text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-[-160px] -translate-x-1/2 w-[760px] h-[520px] rounded-full opacity-[.16]"
          style={{ background: "linear-gradient(120deg,#1E1B4B,#312E81 45%,#4F46E5)", filter: "blur(120px)" }}
        />

        <div className="relative z-10 max-w-[1152px] mx-auto px-6">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-[7px] text-[0.8rem] font-semibold text-indigo-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 block" />
            Pricing
          </span>

          {/* Heading */}
          <h1 className="mt-6 text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold tracking-[-0.035em] text-slate-900 max-w-[18ch] mx-auto leading-[1.12] mb-5">
            Start free. Upgrade when you outgrow it.
          </h1>

          {/* Sub */}
          <p className="text-[1.225rem] text-slate-500 max-w-[60ch] mx-auto leading-relaxed mb-9">
            Every account gets one fully tracked link for free, with real analytics, not a teaser. When you need more links and the premium tools, Plus is $9 a month. The pricing is simple and there is nothing hidden in the fine print.
          </p>

          {/* Billing toggle */}
          <div className="flex justify-center">
            <div
              role="group"
              aria-label="Billing period"
              className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full p-[5px] shadow-[0_1px_3px_rgba(0,0,0,.07)]"
            >
              <button
                type="button"
                onClick={() => setAnnual(false)}
                aria-pressed={!annual}
                className={`px-[22px] py-2.5 rounded-full text-[0.95rem] font-semibold transition-all ${!annual
                    ? "bg-indigo-600 text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,0.6)]"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                aria-pressed={annual}
                className={`px-[22px] py-2.5 rounded-full text-[0.95rem] font-semibold transition-all flex items-center gap-2 ${annual
                    ? "bg-indigo-600 text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,0.6)]"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Annual{" "}
                <span
                  className={`text-[0.72rem] font-bold px-2 py-0.5 rounded-full ${annual
                      ? "bg-white/20 text-white"
                      : "bg-orange-50 text-orange-700"
                    }`}
                >
                  Save 22%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ────────────────────────────────────── */}
      <section className="pb-20" id="plans">
        <div className="max-w-[1152px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-[1080px] mx-auto">

            {/* Guest */}
            {/* <article className="bg-white border border-slate-200 rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] flex flex-col transition-all hover:shadow-[0_16px_38px_-10px_rgba(15,23,42,.20)] hover:-translate-y-1">
              <div className="font-bold text-[1.2rem] text-slate-900 tracking-[-0.01em]">Guest</div>
              <p className="text-slate-500 text-[0.92rem] mt-1.5 leading-[1.45] min-h-[40px]">For a quick link, right now.</p>
              <div className="flex items-baseline gap-1.5 mt-6 mb-1 flex-wrap">
                <span className="text-[2.7rem] font-extrabold tracking-[-0.035em] text-slate-900 leading-none">$0</span>
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

          <p className="text-center text-slate-500 text-[0.92rem] mt-8">
            Your free link and your data stay yours. Move up or down anytime, and you never start over.
          </p>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────── */}
      <section className="py-20 border-t border-slate-100">
        <div className="max-w-[1152px] mx-auto px-6">
          <div className="max-w-[680px] mx-auto text-center mb-14">
            <h2 className="text-[clamp(2rem,3.6vw,2.6rem)] font-extrabold text-slate-900 tracking-tight mb-4">
              Compare every plan
            </h2>
            <p className="text-[1.125rem] text-slate-500">
              The same accurate analytics on Free and Plus. The difference is how many links and which premium tools you need.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-[24px] shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)] bg-white max-w-[1000px] mx-auto">
            <table className="w-full border-collapse min-w-[660px]">
              <thead>
                <tr>
                  <th className="text-left py-6 px-5 text-[1.05rem] font-bold text-slate-900 w-[34%]" />
                  {/* <th className="text-center py-6 px-5 text-[1.05rem] font-bold text-slate-900 w-[22%]">Guest</th> */}
                  <th className="text-center py-6 px-5 text-[1.05rem] font-bold text-slate-900 w-[22%]">Free</th>
                  <th className="text-center py-6 px-5 text-[1.05rem] font-bold text-indigo-700 bg-indigo-50 rounded-tr-[24px] w-[22%]">Plus</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(([label, guest, free, plus], i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-[15px] px-5 text-left font-semibold text-[0.93rem] text-slate-900 w-[34%]">{label}</td>
                    {/* <td className="py-[15px] px-5 text-center w-[22%]"><TableCell val={guest} /></td> */}
                    <td className="py-[15px] px-5 text-center w-[22%]"><TableCell val={free} /></td>
                    <td className="py-[15px] px-5 text-center bg-indigo-50/60 w-[22%]"><TableCell val={plus} plus /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-slate-400 text-[0.82rem] mt-3.5">* Short-link allowance is finalized before launch.</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-100">
        <div className="max-w-[1152px] mx-auto px-6">
          <div className="max-w-[680px] mx-auto text-center mb-14">
            <h2 className="text-[clamp(2rem,3.6vw,2.6rem)] font-extrabold text-slate-900 tracking-tight">
              Questions, answered straight
            </h2>
          </div>

          <div className="max-w-[780px] mx-auto flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
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
                    style={{ maxHeight: isOpen ? "360px" : "0" }}
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