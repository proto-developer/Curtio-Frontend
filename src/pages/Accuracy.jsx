import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import CTASection from "../components/cta";

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
    {
        q: "Why does my link show more clicks than real visitors on other shorteners?",
        a: "Because they count bots, link previews, and scanners as clicks. curtio counts each real visitor once, so the number lines up with reality.",
    },
    {
        q: "Does curtio filter out bots?",
        a: "Not yet. Today we remove duplicate clicks from the same visitor, which fixes the most common inflation problem. Bot filtering is on our roadmap, and we will announce it when it ships.",
    },
    {
        q: "Is this different from Google Analytics?",
        a: "Google Analytics measures activity on your page with JavaScript. curtio measures the click on the link itself and counts each visitor once. Many people use both together.",
    },
];

/* ─────────────────────────────────────────────────────────────
   SVGs
───────────────────────────────────────────────────────────── */
const CheckIcon = () => (
    <svg
        className="w-5 h-5 flex-none text-indigo-600"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const ClockIcon = () => (
    <svg
        className="w-5 h-5 flex-none text-orange-500"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg
        className="w-5 h-5 flex-none text-slate-400"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg
        className="w-[30px] h-[30px] text-indigo-600"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
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

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function Accuracy() {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <>
            <Navbar />

            <main id="main" className="overflow-x-hidden">
            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-36 pb-12 sm:pb-16 text-center">
                <div
                    className="pointer-events-none absolute left-1/2 top-[-160px] -translate-x-1/2 w-[520px] sm:w-[760px] h-[380px] sm:h-[520px] max-w-full rounded-full opacity-[.16]"
                    style={{ background: "linear-gradient(120deg,#1E1B4B,#312E81 45%,#4F46E5)", filter: "blur(120px)" }}
                />

                <div className="relative z-10 max-w-[1152px] mx-auto px-5 sm:px-6">
                    {/* Eyebrow */}
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 sm:px-4 py-1.5 text-xs md:text-sm font-semibold text-indigo-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                        Why curtio
                    </span>

                    {/* Heading */}
                    <h1 className="mt-5 sm:mt-6 text-[clamp(1.95rem,8vw,3.6rem)] font-extrabold tracking-[-0.035em] text-slate-900 max-w-[15ch] mx-auto leading-[1.12] mb-3 sm:mb-4">
                        We count clicks the honest way
                    </h1>

                    {/* Sub */}
                    <p className="text-[0.95rem] sm:text-base md:text-lg text-slate-500 max-w-md sm:max-w-[60ch] mx-auto leading-relaxed text-justify sm:text-center">
                        Most shorteners pad your numbers, and most will not tell you they do it. This page explains where click counting goes wrong and what curtio does about it. No black box, no spin.
                    </p>
                </div>
            </section>

            {/* ── PROBLEM ──────────────────────────────────────────── */}
            <section className="py-14 sm:py-20">
                <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
                    <div className="max-w-[680px] mx-auto text-center mb-10 sm:mb-14">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            A click is not always a person
                        </h2>
                    </div>
                    <div className="max-w-[720px] mx-auto text-slate-700 text-[0.95rem] sm:text-base md:text-lg leading-[1.72] space-y-5 text-justify sm:text-left">
                        <p>
                            When you share a short link, plenty of things touch it that are not your audience. A chat app fetches a preview. A security scanner checks that it is safe. A bot crawls it. Any of those can register as a click. Most shorteners count them all. So the number on your dashboard ends up bigger than the number of real people who actually visited.
                        </p>
                    </div>

                    <p className="text-center font-extrabold tracking-tight text-slate-950 text-[clamp(1.6rem,7vw,3.1rem)] max-w-[15ch] mx-auto my-10 sm:my-16 leading-[1.16]">
                        One real visitor can show up as{" "}
                        <span
                            className="bg-clip-text text-transparent"
                            style={{ backgroundImage: "linear-gradient(115deg,#4F46E5 0%,#7C3AED 45%,#F97316 100%)" }}
                        >
                            four
                        </span>{" "}
                        clicks.
                    </p>

                    <div className="max-w-[720px] mx-auto text-slate-700 text-[0.95rem] sm:text-base md:text-lg leading-[1.72] space-y-5 text-justify sm:text-left">
                        <p>
                            For a casual user that is just annoying. If you earn from your traffic, it is expensive. Affiliate links, AdSense, sponsored posts: when the count is wrong, you cannot tell which channel paid off. You end up backing traffic that was never real, and reporting numbers you cannot stand behind.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── WHAT WE DO DIFFERENTLY ───────────────────────────── */}
            <section className="py-14 sm:py-20 bg-slate-100 border-y border-slate-200">
                <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
                    <div className="max-w-[680px] mx-auto text-center mb-10 sm:mb-14">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            What we do differently
                        </h2>
                    </div>

                    <div className="flex flex-col sm:grid sm:grid-cols-3 relative text-left sm:text-center">
                        {[
                          { step: '1', title: 'We count each visitor once', desc: 'When the same visitor hits your link several times in a short window, we count it as one visit. The 1-becomes-4 problem goes away.' },
                          { step: '2', title: 'We show you real patterns', desc: 'Clicks over time, by device, by country, by referrer, all built from clean counts. The trends you see are trends that are actually there.' },
                          { step: '3', title: 'We stay honest about limits', desc: 'We tell you exactly what we count and how. When we add more, we will say so, instead of quietly padding your numbers to look impressive.' },
                        ].map((item, i, arr) => (
                          <div key={item.step} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 relative pb-8 last:pb-0 sm:pb-0 sm:px-4">
                            {/* vertical dotted connector — mobile */}
                            {i < arr.length - 1 && (
                              <span className="sm:hidden absolute left-[19px] top-[40px] bottom-0 w-0.5"
                                style={{ background: 'repeating-linear-gradient(180deg,#CBD5E1 0 6px,transparent 6px 12px)' }} />
                            )}
                            {/* horizontal dotted connector — sm and up */}
                            {i > 0 && (
                              <span className="hidden sm:block absolute top-[30px] left-[calc(-50%+30px)] w-[calc(100%-60px)] h-0.5"
                                style={{ background: 'repeating-linear-gradient(90deg,#CBD5E1 0 6px,transparent 6px 12px)' }} />
                            )}
                            <div className="relative z-10 shrink-0 w-10 h-10 sm:w-[60px] sm:h-[60px] rounded-full bg-indigo-600 text-white flex items-center justify-center text-base sm:text-xl font-bold sm:mb-5 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)]">
                              {item.step}
                            </div>
                            <div className="flex-1 sm:flex-none">
                              <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1.5 sm:mb-2">{item.title}</h3>
                              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HONEST ROADMAP ───────────────────────────────────── */}
            <section className="py-14 sm:py-20">
                <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
                    <div className="max-w-[680px] mx-auto text-center mb-10 sm:mb-14">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
                            What we count today, and what is next
                        </h2>
                        <p className="text-[0.95rem] sm:text-base md:text-lg text-slate-500">
                            We would rather show you where we stand than pretend we do everything. So here is the straight version.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-[920px] mx-auto">
                        {/* Today Card */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] hover:shadow-[0_16px_38px_-10px_rgba(15,23,42,.20)] hover:-translate-y-[3px] transition-all">
                            <span className="inline-flex items-center gap-2 text-[0.78rem] font-bold tracking-wider uppercase bg-indigo-600 text-white px-3.5 py-1.5 rounded-full mb-5 sm:mb-6">
                                <CheckIcon />
                                Today
                            </span>
                            <ul className="flex flex-col gap-4">
                                {[
                                    "Each visitor counted once, no duplicates",
                                    "Real-time analytics by time, device, country, referrer",
                                    "Hashed IPs, no raw visitor data stored"
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 items-start text-[0.95rem] sm:text-[1.02rem] text-slate-700 leading-normal">
                                        <CheckIcon />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Roadmap Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] hover:shadow-[0_16px_38px_-10px_rgba(15,23,42,.20)] hover:-translate-y-[3px] transition-all">
                            <span className="inline-flex items-center gap-2 text-[0.78rem] font-bold tracking-wider uppercase bg-orange-50 text-orange-700 px-3.5 py-1.5 rounded-full mb-5 sm:mb-6">
                                <ClockIcon />
                                On the roadmap
                            </span>
                            <ul className="flex flex-col gap-4">
                                {[
                                    "Bot and spam-traffic filtering",
                                    "Longer analytics history",
                                    "Deeper traffic-source detail"
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 items-start text-[0.95rem] sm:text-[1.02rem] text-slate-700 leading-normal">
                                        <ArrowRightIcon />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <p className="text-center text-slate-500 text-[0.95rem] sm:text-[0.98rem] max-w-[58ch] mx-auto mt-8 leading-[1.6]">
                        We would rather tell you what we do not do yet than fake it. That is the whole point of curtio.
                    </p>
                </div>
            </section>

            {/* ── PRIVACY NOTE ─────────────────────────────────────── */}
            <section className="py-14 sm:py-20">
                <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
                    <div className="max-w-[760px] mx-auto text-center bg-white border border-slate-200 rounded-2xl p-8 sm:p-[52px_44px] shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)]">
                        <div className="w-14 h-14 sm:w-[62px] sm:h-[62px] rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                            <ShieldCheckIcon />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 sm:mb-3.5">
                            Accurate does not mean invasive
                        </h2>
                        <p className="text-slate-500 text-[0.95rem] sm:text-base md:text-lg leading-[1.66] max-w-[54ch] mx-auto text-justify sm:text-center">
                            Counting clicks honestly does not require hoarding data about your visitors. We hash IP addresses and never store raw visitor information. You get the numbers you need, and your audience keeps their privacy.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────── */}
            <section className="pb-14 sm:pb-20">
                <div className="max-w-[1152px] mx-auto px-5 sm:px-6">
                    <div className="max-w-[780px] mx-auto flex flex-col gap-3">
                        {FAQ_ITEMS.map((item, i) => {
                            const isOpen = openFaq === i;
                            return (
                                <div
                                    key={i}
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
                                        style={{ maxHeight: isOpen ? "360px" : "0" }}
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

            {/* ── CTA ──────────────────────────────────────────────── */}
            <CTASection
                heading="See your real numbers"
                description="Make a free account and watch accurate analytics come in, in real time. You get one tracked link free, and you can move up to Plus when you need more."
                buttonText="Get started free"
                buttonLink="/register"
            />
            </main>

            <Footer />
        </>
    );
}