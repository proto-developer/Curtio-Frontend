import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

/* ─────────────────────────────────────────────────────────────
   CONTENT
───────────────────────────────────────────────────────────── */
const LAST_UPDATED = "August 28, 2026";
const LAST_UPDATED_ISO = "2026-08-28";

const INTRO = [
  "Curtio is a digital software-as-a-service (SaaS) platform. We do not sell or ship physical products.",
];

const SECTIONS = [
  {
    number: "1",
    id: "digital-service-delivery",
    title: "Digital Service Delivery",
    bullets: [
      "When you create a Curtio account, access to the applicable free features is provided electronically through your account.",
      "For paid plans, access to the purchased features is provided electronically after successful payment and activation of the subscription.",
      "There is no physical delivery, shipping address, courier service, or tracking number associated with Curtio subscriptions.",
    ],
  },
  {
    number: "2",
    id: "when-you-receive-access",
    title: "When You Receive Access",
    bullets: [
      "For a paid subscription, service access is normally made available after the payment has been successfully processed and the subscription has been activated.",
      "If access is not available after a successful payment, please contact support@curtio.io so we can investigate the issue.",
    ],
  },
  {
    number: "3",
    id: "service-availability",
    title: "Service Availability",
    bullets: [
      "Curtio aims to provide reliable access to the Service, but we do not guarantee uninterrupted or error-free availability.",
      "Temporary interruptions may occur because of maintenance, upgrades, technical issues, security measures, third-party infrastructure, or circumstances outside our reasonable control.",
    ],
  },
  {
    number: "4",
    id: "failed-or-interrupted-payments",
    title: "Failed or Interrupted Payments",
    bullets: [
      "If a payment fails or is not successfully completed, paid features may not be activated.",
      "If your payment was successfully charged but your Curtio account does not reflect the expected service, contact us with your account email and payment details so we can investigate.",
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
export default function ShippingPolicy() {
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
              Shipping &amp; Service Policy
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
                    <span className="font-semibold text-slate-400 mr-1.5">5.</span>
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

                  <ul className="flex flex-col gap-3">
                    {section.bullets.map((text) => (
                      <li key={text} className="flex items-start gap-2.5 text-[0.98rem] text-slate-600 leading-[1.65]">
                        <BulletIcon /><span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}

              {/* 5. Contact Us */}
              <article id="contact-us" className="scroll-mt-[100px]">
                <h2 className="text-[1.45rem] font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                  <span className="text-indigo-600">5.</span> Contact Us
                </h2>

                <p className="text-slate-600 text-[1rem] leading-[1.75] mb-6">
                  For questions about service delivery or access:
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
              <Link to="/refund-policy" className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                Refund &amp; Return Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms-of-service" className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                Terms of Service
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
