import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

/* ─────────────────────────────────────────────────────────────
   CONTENT
───────────────────────────────────────────────────────────── */
const LAST_UPDATED = "August 28, 2026";
const LAST_UPDATED_ISO = "2026-08-28";

const INTRO = [
  'Curtio ("Curtio," "we," "us," or "our") builds URL shortening and link analytics tools. This policy explains what information we collect when you use curtio.io and any redirect.curtio.io links, why we collect it, and what control you have over it.',
  "By using Curtio, you agree to the practices described below. If you don't agree, please don't use the Service.",
];

/* Section numbers follow the published Privacy Policy exactly. */
const SECTIONS = [
  {
    number: "1",
    id: "information-we-collect",
    title: "Information We Collect",
    subsections: [
      {
        title: "Information You Give Us Directly",
        bullets: [
          "Account details: email address, password (stored encrypted), and billing information if you upgrade to a paid plan when paid subscriptions become available.",
          "Link data: the destination URLs you shorten, any custom aliases you create, UTM tags you add, and expiration dates you set.",
        ],
      },
      {
        title: "Information Collected Automatically",
        paragraphs: [
          "When someone clicks one of your shortened links, or when you use the Curtio dashboard, we automatically collect:",
        ],
        bullets: [
          "IP address (used to determine approximate country/region, then not retained in raw form beyond what's needed for that purpose)",
          "Device type, operating system, and browser",
          "Referrer (the page or app the click came from)",
          "Timestamp of the click",
          "Whether the click session appears to originate from a person or from automated traffic (bots, link previews, security scanners); this is core to how our analytics work",
        ],
        outro: [
          "We built our click-counting system specifically to separate real visitors from automated requests, so this filtering data is collected as part of delivering that feature, not as an incidental byproduct.",
        ],
      },
      {
        title: "Cookies and Similar Technologies",
        paragraphs: [
          "We use cookies to keep you logged in, remember dashboard preferences, and measure link performance. You can disable cookies in your browser, though parts of the dashboard may not function correctly without them.",
        ],
      },
    ],
  },
  {
    number: "3",
    id: "how-we-use-information",
    title: "How We Use Information",
    paragraphs: ["We use the information above to:"],
    bullets: [
      "Operate the redirect and analytics service",
      "Distinguish genuine visitors from bots, crawlers, and preview fetchers so your click counts are accurate",
      "Generate the dashboard reports you see (device, country, referrer, and time)",
      "Process payments and manage your subscription when paid subscriptions are available",
      "Send service-related emails (billing, security alerts, product updates you haven't opted out of)",
      "Maintain the security and integrity of the platform, including detecting abuse, spam, and malicious links",
      "Improve and troubleshoot the product",
    ],
    outro: [
      "We do not sell your personal information, and we do not use the destination URLs or click data from your links to build advertising profiles of your own visitors for our own purposes.",
    ],
  },
  {
    number: "4",
    id: "how-we-share-information",
    title: "How We Share Information",
    paragraphs: ["We share information only in these circumstances:"],
    bullets: [
      "Service providers: hosting, payment processing, email delivery, and infrastructure vendors who process data on our behalf under contractual confidentiality obligations.",
      "Legal requirements: if required to comply with a valid legal process, protect our rights, or prevent fraud or harm.",
      "Business transfers: if Curtio is involved in a merger, acquisition, or asset sale, information may be transferred as part of that transaction, subject to this policy's protections continuing to apply.",
    ],
    outro: ["We never sell click or visitor data to data brokers."],
  },
  {
    number: "5",
    id: "data-retention",
    title: "Data Retention",
    paragraphs: [
      "We retain account information for as long as your account is active. Click and analytics data is retained according to your plan's history window; you can request deletion of your account and associated data at any time (see Section 7).",
    ],
  },
  {
    number: "6",
    id: "international-users",
    title: "International Users",
    paragraphs: [
      "Curtio serves visitors in 180+ countries. If you access our Service from outside the country where our servers are located, your information may be transferred internationally. We take reasonable steps to ensure such transfers are protected consistent with this policy.",
    ],
  },
  {
    number: "7",
    id: "your-rights-and-choices",
    title: "Your Rights and Choices",
    paragraphs: ["Depending on where you live, you may have the right to:"],
    bullets: [
      "Access the personal information we hold about you",
      "Correct inaccurate information",
      "Request deletion of your account and data",
      "Object to or restrict certain processing",
      "Export your data in a portable format",
    ],
    outro: [
      "To exercise any of these rights, contact us at support@curtio.io. We'll respond within the timeframe required by applicable law.",
    ],
  },
  {
    number: "8",
    id: "data-security",
    title: "Data Security",
    paragraphs: [
      "We use encryption in transit and at rest, access controls, and regular security review to protect your information. No system is completely secure, and we can't guarantee absolute security, but we work to minimize risk and will notify you as required by law in the event of a breach affecting your data.",
    ],
  },
  {
    number: "9",
    id: "childrens-privacy",
    title: "Children's Privacy",
    paragraphs: [
      "Curtio is not directed at children under 16, and we do not knowingly collect personal information from them. If you believe a child has provided us information, contact us and we'll delete it.",
    ],
  },
  {
    number: "10",
    id: "changes-to-this-policy",
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this policy from time to time as our product or legal obligations change. If we make material changes, we'll notify you by email or through a notice on the dashboard. Continued use of the Service after changes take effect means you accept the updated policy.",
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

/* Paragraphs → bullets → closing paragraphs, in that order. */
function SectionBody({ paragraphs, bullets, outro }) {
  return (
    <div className="flex flex-col gap-4">
      {paragraphs?.map((text) => (
        <p key={text} className="text-slate-600 text-[1rem] leading-[1.75]">
          {text}
        </p>
      ))}

      {bullets && (
        <ul className="flex flex-col gap-3 mt-1">
          {bullets.map((text) => (
            <li key={text} className="flex items-start gap-2.5 text-[0.98rem] text-slate-600 leading-[1.65]">
              <BulletIcon /><span>{text}</span>
            </li>
          ))}
        </ul>
      )}

      {outro?.map((text) => (
        <p key={text} className="text-slate-600 text-[1rem] leading-[1.75]">
          {text}
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function PrivacyPolicy() {
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
              Privacy Policy
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
                    <span className="font-semibold text-slate-400 mr-1.5">11.</span>
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

                  <SectionBody
                    paragraphs={section.paragraphs}
                    bullets={section.bullets}
                    outro={section.outro}
                  />

                  {section.subsections?.map((sub) => (
                    <div key={sub.title} className="mt-7">
                      <h3 className="text-[1.05rem] font-bold text-slate-900 tracking-[-0.01em] mb-3">
                        {sub.title}
                      </h3>
                      <SectionBody
                        paragraphs={sub.paragraphs}
                        bullets={sub.bullets}
                        outro={sub.outro}
                      />
                    </div>
                  ))}
                </article>
              ))}

              {/* 11. Contact Us */}
              <article id="contact-us" className="scroll-mt-[100px]">
                <h2 className="text-[1.45rem] font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                  <span className="text-indigo-600">11.</span> Contact Us
                </h2>

                <p className="text-slate-600 text-[1rem] leading-[1.75] mb-6">
                  Questions about this policy or your data? Reach us at:
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
