import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

/* ─────────────────────────────────────────────────────────────
   CONTENT
───────────────────────────────────────────────────────────── */
const LAST_UPDATED = "August 28, 2026";
const LAST_UPDATED_ISO = "2026-08-28";

const INTRO = [
  "Curtio provides digital software services, including URL shortening, link management, analytics, QR codes, and related features. Because Curtio is a digital SaaS service, there are no physical products to return.",
];

const SECTIONS = [
  {
    number: "1",
    id: "subscription-payments",
    title: "Subscription Payments",
    bullets: [
      "Paid Curtio subscriptions are billed according to the plan and billing interval selected at the time of purchase.",
      "Before completing a purchase, you will be shown the applicable subscription price and billing terms.",
    ],
  },
  {
    number: "2",
    id: "refunds",
    title: "Refunds",
    bullets: [
      "Subscription fees are generally non-refundable, except where a refund is required by applicable law or is expressly offered by Curtio.",
      "If you believe you were charged in error, charged more than once, or experienced another billing issue, contact us at support@curtio.io as soon as possible with your account email and relevant payment details.",
      "We will review the request and determine whether a refund or billing adjustment is appropriate.",
    ],
  },
  {
    number: "3",
    id: "cancellation",
    title: "Cancellation",
    bullets: [
      "You may cancel your paid subscription through your account settings, where that functionality is available.",
      "Cancellation stops future renewal. Unless otherwise required by law or expressly stated at the time of purchase, cancellation does not automatically create a right to a refund for the current billing period.",
      "You will generally retain access to paid features until the end of the period that you have already paid for.",
    ],
  },
  {
    number: "4",
    id: "service-issues",
    title: "Service Issues",
    bullets: [
      "If Curtio experiences a significant technical problem that prevents you from accessing a paid service, please contact us at support@curtio.io.",
      "We may, at our discretion and where appropriate, provide a service credit, extension, refund, or other reasonable remedy.",
    ],
  },
  {
    number: "5",
    id: "exceptions-required-by-law",
    title: "Exceptions Required by Law",
    paragraphs: [
      "Nothing in this policy limits any refund or consumer rights that cannot legally be excluded or restricted under applicable law.",
    ],
  },
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

/* ─────────────────────────────────────────────────────────────
   SMALL REUSABLE SVG
───────────────────────────────────────────────────────────── */
const BulletIcon = () => (
  <svg
    className="w-[18px] h-[18px] flex-none text-indigo-600 mt-[3px]"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function RefundPolicy() {
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
              Legal
            </span>

            <h1 className="mt-6 text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold tracking-[-0.035em] text-slate-900 leading-[1.12] mb-4">
              Refund &amp; Return Policy
            </h1>

            <p className="text-slate-400 text-[0.875rem]">
              Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
            </p>
          </div>
        </section>

        {/* ── INTRO ──────────────────────────────────────────── */}
        <section className="pb-16">
          <div className="max-w-[1152px] mx-auto px-6">
            <div className="max-w-[780px] mx-auto bg-white border border-slate-200 rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)] flex flex-col gap-4">
              {INTRO.map((text) => (
                <p key={text} className="text-slate-600 text-[1rem] leading-[1.75]">
                  {text}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTENTS ───────────────────────────────────────── */}
        <section className="pb-16">
          <div className="max-w-[1152px] mx-auto px-6">
            <nav aria-label="Contents" className="max-w-[780px] mx-auto bg-white border border-slate-200 rounded-[16px] p-8 shadow-[0_1px_3px_rgba(0,0,0,.07)]">
              <h2 className="text-[0.82rem] font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Contents
              </h2>
              <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-[0.93rem] text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <span className="font-semibold text-slate-400 mr-1.5">{section.number}.</span>
                      {section.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#contact-us"
                    className="text-[0.93rem] text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <span className="font-semibold text-slate-400 mr-1.5">6.</span>
                    Contact Us
                  </a>
                </li>
              </ol>
            </nav>
          </div>
        </section>

        {/* ── SECTIONS ───────────────────────────────────────── */}
        <section className="pb-20">
          <div className="max-w-[1152px] mx-auto px-6">
            <div className="max-w-[780px] mx-auto flex flex-col gap-12">
              {SECTIONS.map((section) => (
                <article key={section.id} id={section.id} className="scroll-mt-[100px]">
                  <h2 className="text-[1.45rem] font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                    <span className="text-indigo-600">{section.number}.</span> {section.title}
                  </h2>

                  <div className="flex flex-col gap-4">
                    {section.paragraphs?.map((text) => (
                      <p key={text} className="text-slate-600 text-[1rem] leading-[1.75]">
                        {text}
                      </p>
                    ))}

                    {section.bullets && (
                      <ul className="flex flex-col gap-3 mt-1">
                        {section.bullets.map((text) => (
                          <li key={text} className="flex items-start gap-2.5 text-[0.98rem] text-slate-600 leading-[1.65]">
                            <BulletIcon /><span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}

              {/* 6. Contact Us */}
              <article id="contact-us" className="scroll-mt-[100px]">
                <h2 className="text-[1.45rem] font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                  <span className="text-indigo-600">6.</span> Contact Us
                </h2>

                <p className="text-slate-600 text-[1rem] leading-[1.75] mb-6">
                  For refund or billing questions, contact:
                </p>

                <dl className="bg-white border border-slate-200 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,.07)] divide-y divide-slate-100">
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
              </article>
            </div>

            <p className="max-w-[780px] mx-auto text-center text-slate-500 text-[0.92rem] mt-14">
              See also our{" "}
              <Link to="/terms-of-service" className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/pricing" className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                Pricing Plan
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
