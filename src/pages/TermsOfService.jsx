import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

/* ─────────────────────────────────────────────────────────────
   CONTENT
───────────────────────────────────────────────────────────── */
const LAST_UPDATED = "August 28, 2026";
const LAST_UPDATED_ISO = "2026-08-28";

const INTRO = [
  'These Terms of Service ("Terms") govern your access to and use of Curtio\'s URL shortening, analytics, and related tools (the "Service"), operated at curtio.io and redirect.curtio.io. By creating an account, shortening a link, or otherwise using the Service, you agree to these Terms.',
  'If you\'re using Curtio on behalf of a company or other entity, you\'re confirming you have authority to bind that entity, and "you" refers to both you and that entity.',
];

/* Section numbers follow the published Terms exactly. */
const SECTIONS = [
  {
    number: "1",
    id: "the-service",
    title: "The Service",
    paragraphs: [
      "Curtio converts long URLs into short links, generates QR codes for those links, and reports click analytics filtered to reflect genuine visitors rather than automated traffic (bots, crawlers, link-preview fetches). Depending on your plan, you can create one tracked link on Free, or more than one tracked link on Plus. Signed-in users can also use custom aliases, UTM tags, link expiration, and a dashboard for links and campaigns.",
      "We may add, change, or discontinue features at any time. We'll make reasonable efforts to notify you of material changes that affect paid features.",
    ],
  },
  {
    number: "2",
    id: "accounts",
    title: "Accounts",
    bullets: [
      "You must provide accurate information when creating an account and keep it up to date.",
      "You're responsible for maintaining the confidentiality of your login credentials and for all activity under your account.",
      "You must be at least 16 years old to create an account.",
      "Notify us immediately at support@curtio.io if you suspect unauthorized access to your account.",
    ],
  },
  {
    number: "3",
    id: "acceptable-use",
    title: "Acceptable Use",
    paragraphs: ["You agree not to use Curtio to create, shorten, or distribute links that:"],
    bullets: [
      "Point to malware, phishing pages, or content designed to compromise a device or steal credentials",
      "Facilitate illegal activity in any applicable jurisdiction",
      "Distribute spam, including unsolicited bulk messaging",
      "Infringe someone else's intellectual property or privacy rights",
      "Contain or link to child sexual abuse material, or any content exploiting minors",
      "Impersonate a person, company, or brand in a deceptive way",
      "Are used to evade link-blocking or filtering systems put in place by a third party for safety or security reasons",
    ],
    outro: [
      "We reserve the right to disable, delete, or refuse to shorten any link, and to suspend or terminate any account, that we determine at our discretion violates this section, without prior notice where the violation poses immediate risk.",
    ],
  },
  {
    number: "4",
    id: "custom-aliases-and-link-ownership",
    title: "Custom Aliases and Link Ownership",
    paragraphs: [
      "Custom aliases are granted on a first-come, first-served basis and are not permanently reserved if your account is deleted or a paid plan lapses beyond any applicable grace period. You retain no trademark or ownership claim over an alias beyond your right to use it while your account remains active and in good standing. We may reclaim aliases that impersonate another brand or infringe third-party rights.",
    ],
  },
  {
    number: "6",
    id: "plans-billing-and-free-tier",
    title: "Plans, Billing, and Free Tier",
    paragraphs: [
      'Curtio offers a free tier with a limited number of tracked links and a paid "Plus" tier (and any other paid tiers we may offer) with expanded limits and features.',
    ],
    bullets: [
      "Paid subscriptions will be available only when online payment and subscription functionality is enabled by Curtio.",
      "When paid subscriptions become available, subscriptions will renew automatically at the billing interval selected at the time of purchase until canceled, unless otherwise stated.",
      "Once available, you may cancel a paid subscription according to the cancellation options provided in your account settings. Unless otherwise stated, cancellation will take effect at the end of the current billing period.",
      "Fees are non-refundable except where required by law or explicitly stated otherwise at the time of purchase.",
      "We may change pricing with advance notice; continued use after a price change takes effect constitutes acceptance of the new pricing for your next billing cycle.",
    ],
  },
  {
    number: "7",
    id: "link-expiration",
    title: "Link Expiration",
    paragraphs: [
      "If you set an expiration date on a link, we'll enforce it as configured, but we don't guarantee availability of the Service without interruption, and we're not liable for consequences of a link becoming inaccessible due to expiration, deletion, or Service downtime.",
    ],
  },
  {
    number: "8",
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "Curtio and its logo, design, and underlying technology are owned by us and protected by intellectual property law. These Terms don't grant you any rights to our trademarks or branding beyond what's necessary to use the Service as intended. You retain all rights to the destination URLs and content you link to.",
    ],
  },
  {
    number: "9",
    id: "disclaimers",
    title: "Disclaimers",
    paragraphs: [
      'The Service is provided "as is" and "as available." To the maximum extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
      "We don't warrant that the Service will be uninterrupted, error-free, or that click analytics will be perfectly accurate in every circumstance. While we've built our filtering to be as precise as possible, no bot-detection system is infallible.",
    ],
  },
  {
    number: "10",
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, Curtio and its team will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits or revenue, arising from your use of or inability to use the Service even if we've been advised of the possibility of such damages.",
      "Our total liability for any claim relating to the Service is limited to the amount you paid us in the twelve months preceding the claim, or $100 if you're on the free tier.",
    ],
  },
  {
    number: "11",
    id: "indemnification",
    title: "Indemnification",
    paragraphs: [
      "You agree to indemnify and hold Curtio harmless from any claims, damages, or expenses (including reasonable legal fees) arising from your use of the Service, your links or their destinations, or your violation of these Terms.",
    ],
  },
  {
    number: "12",
    id: "termination",
    title: "Termination",
    paragraphs: [
      "You may delete your account at any time. We may suspend or terminate your access if you violate these Terms, pose a security risk, or if required by law.",
      "Upon termination, your links may stop resolving and your data may be deleted according to our data retention practices described in our Privacy Policy.",
    ],
  },
  {
    number: "13",
    id: "changes-to-these-terms",
    title: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. If changes are material, we'll notify you by email or in-app notice before they take effect. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.",
    ],
  },
  {
    number: "14",
    id: "governing-law",
    title: "Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the jurisdiction in which Curtio is legally established, without regard to conflict-of-law principles, except where applicable local law requires otherwise.",
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
export default function TermsOfService() {
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
              Terms of Service
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
                    <span className="font-semibold text-slate-400 mr-1.5">15.</span>
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

                    {section.outro?.map((text) => (
                      <p key={text} className="text-slate-600 text-[1rem] leading-[1.75]">
                        {text}
                      </p>
                    ))}
                  </div>
                </article>
              ))}

              {/* 15. Contact Us */}
              <article id="contact-us" className="scroll-mt-[100px]">
                <h2 className="text-[1.45rem] font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                  <span className="text-indigo-600">15.</span> Contact Us
                </h2>

                <p className="text-slate-600 text-[1rem] leading-[1.75] mb-6">
                  Questions about these Terms? Reach us at:
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
