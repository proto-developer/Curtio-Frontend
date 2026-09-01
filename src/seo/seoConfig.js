// Single source of truth for per-route SEO metadata.
// Add a route here and it is picked up automatically by <RouteSeo /> in App.jsx.

const rawOrigin =
  import.meta.env?.VITE_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "https://curtio.io");

export const SITE_ORIGIN = String(rawOrigin).replace(/\/+$/, "");
export const SITE_NAME = "Curtio";
export const TWITTER_HANDLE = "@curtio";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export const absoluteUrl = (path = "/") =>
  /^https?:\/\//i.test(path) ? path : `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

// `noindex: true` keeps private / duplicate surfaces out of search results.
export const ROUTE_SEO = {
  "/": {
    title: "Curtio — URL shortener with real click tracking",
    description:
      "Curtio turns long URLs into clean short links and counts every click the right way. See real visitors, not bots and link previews padding your numbers.",
  },
  "/features": {
    title: "Features — every tool your links need | Curtio",
    description:
      "Short links, custom slugs, QR codes, campaigns and click analytics in plain terms. No bloat, no upsell maze — here is the full list of what Curtio does.",
  },
  "/pricing": {
    title: "Pricing — free for 1 link, $10/mo for unlimited | Curtio",
    description:
      "Free includes 1 link per user with QR codes, click analytics, custom aliases, UTM tags and 1 campaign. Plus is $10 a month, or $96 a year, for unlimited links and campaigns.",
  },
  "/terms-of-service": {
    title: "Terms of Service | Curtio",
    description:
      "The terms governing your access to and use of Curtio's URL shortening, analytics, and related tools, including accounts, acceptable use, plans and billing.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Curtio",
    description:
      "What Curtio collects when you use curtio.io and redirect.curtio.io links, why we collect it, how we share and retain it, and the control you have over your data.",
  },
  "/refund-policy": {
    title: "Refund & Return Policy | Curtio",
    description:
      "How refunds, cancellation, and billing issues work for paid Curtio subscriptions, and how to reach us about a charge you believe was made in error.",
  },
  "/shipping-policy": {
    title: "Shipping & Service Policy | Curtio",
    description:
      "Curtio is a digital SaaS platform with no physical products to ship. How and when access to free and paid features is delivered electronically.",
  },
  "/accuracy": {
    title: "Click accuracy — we count clicks the honest way | Curtio",
    description:
      "Most shorteners pad your click numbers and will not tell you. See exactly where click counting goes wrong and how Curtio filters bots and link previews.",
  },
  "/blog": {
    title: "Blog — insights on links, analytics & growth | Curtio",
    description:
      "Practical guides on short links, click analytics and campaign tracking for marketers, developers and builders who care about their links.",
  },
  "/login": {
    title: "Sign in to Curtio",
    description: "Sign in to your Curtio account to manage your short links and view click analytics.",
    noindex: true,
  },
  "/register": {
    title: "Create your free Curtio account",
    description:
      "Create a free Curtio account. Free forever, no credit card needed — one tracked link with full click analytics.",
  },
  "/password/:shortCode": {
    title: "Protected link | Curtio",
    description: "This Curtio link is password protected. Enter the password to continue.",
    noindex: true,
  },
  "/forgot-password": {
    title: "Reset your password | Curtio",
    description: "Reset the password for your Curtio account.",
    noindex: true,
  },
  "/dashboard": { title: "Dashboard | Curtio", description: "Manage your short links.", noindex: true },
  "/dashboard/editprofile": { title: "Profile | Curtio", description: "Manage your Curtio profile.", noindex: true },
  "/dashboard/analytics": {
    title: "Redirected Link Dashboard | Curtio",
    description: "Redirected click analytics across all your links.",
    noindex: true,
  },
  "/dashboard/preclick": {
    title: "Non-Redirected Analytics | Curtio",
    description: "See non-redirected traffic on your links.",
    noindex: true,
  },
  "/dashboard/campaigns": { title: "Campaigns | Curtio", description: "Manage your link campaigns.", noindex: true },
  "/analytics/:id": { title: "Link analytics | Curtio", description: "Click analytics for a single link.", noindex: true },
  "/blog/:slug": {
    // Real values are supplied by BlogPost.jsx once the post loads.
    title: "Blog | Curtio",
    description: "Practical guides on short links, click analytics and campaign tracking.",
  },
};

export const DEFAULT_SEO = ROUTE_SEO["/"];

/** Resolve SEO for a pathname, matching the `:param` routes too. */
export function resolveRouteSeo(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (ROUTE_SEO[path]) return { ...ROUTE_SEO[path], canonical: absoluteUrl(path) };

  const segments = path.split("/").filter(Boolean);
  for (const [pattern, seo] of Object.entries(ROUTE_SEO)) {
    const patternSegments = pattern.split("/").filter(Boolean);
    if (patternSegments.length !== segments.length) continue;
    const matches = patternSegments.every(
      (segment, i) => segment.startsWith(":") || segment === segments[i]
    );
    if (matches) return { ...seo, canonical: absoluteUrl(path) };
  }
  return { ...DEFAULT_SEO, canonical: absoluteUrl(path) };
}
