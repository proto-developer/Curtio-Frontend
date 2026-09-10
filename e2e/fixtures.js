import { test as base, expect } from '@playwright/test';

/**
 * Shared e2e fixtures.
 *
 * Every spec imports { test, expect } from here instead of from
 * '@playwright/test' so it gets:
 *   - `routes`          — one place to look up an app path
 *   - `app.signIn`      — seed a valid session for a known user persona
 *   - `app.seedSession` — seed an arbitrary/expired/garbage token
 *   - `app.api`         — a mutable in-memory backend the app talks to
 *   - `app.goto`        — navigate with the configured baseURL (relative only)
 *   - `personas`, `makeToken`, `badTokens`, `loginSuccessFor`, `otpSuccessFor`
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Routes — the single source of truth for URLs across the suite.
 * ──────────────────────────────────────────────────────────────────────────── */
export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  pricing: '/pricing',
  features: '/features',

  // Authenticated app
  links: '/dashboard',
  dashboard: '/dashboard',
  analytics: '/dashboard/analytics',
  campaigns: '/dashboard/campaigns',
  preClick: '/dashboard/preclick',
  editProfile: '/dashboard/editprofile',

  linkAnalytics: (id) => `/analytics/${id}`,
};

/** Every route that must bounce a signed-out visitor to /login. */
export const protectedRoutes = [
  routes.dashboard,
  routes.analytics,
  routes.campaigns,
  routes.preClick,
  routes.editProfile,
];

/* ────────────────────────────────────────────────────────────────────────────
 * User personas — the account types the app renders differently.
 * ──────────────────────────────────────────────────────────────────────────── */
export const personas = {
  /** Runs the tool: unlimited links, pre-click analytics, "Admin" badge. */
  owner: {
    id: '650000000000000000000001',
    name: 'Olivia Owner',
    email: 'owner@curtio.test',
    claims: { isOwner: true, isPremium: false },
  },
  /** Paying subscriber: unlimited links, but no pre-click analytics. */
  premiumUser: {
    id: '650000000000000000000005',
    name: 'Priya Premium',
    email: 'premium@curtio.test',
    claims: { isOwner: false, isPremium: true },
  },
  /** Free tier: 1-link quota, no pre-click pages. */
  freeUser: {
    id: '650000000000000000000010',
    name: 'Fred Free',
    email: 'free@curtio.test',
    claims: { isOwner: false, isPremium: false },
  },
};

const DAY_SECONDS = 86400;

/** Build a decode-able (unsigned) JWT the client-side guards accept. */
export function makeToken(persona, { expiresInSeconds = DAY_SECONDS } = {}) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({
    id: persona.id,
    email: persona.email,
    ...persona.claims,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  return `${header}.${payload}.signature`;
}

/** The `LoginUser` object the app persists next to the token. */
export function loginUserFor(persona) {
  return {
    id: persona.id,
    name: persona.name,
    email: persona.email,
    ...persona.claims,
  };
}

/** A successful `/auth/login` response body for a persona. */
export function loginSuccessFor(personaKey) {
  const persona = personas[personaKey];
  return {
    success: true,
    apiToken: makeToken(persona),
    LoginUser: loginUserFor(persona),
  };
}

/**
 * A successful `/auth/verify-otp` response body for a persona — same shape the
 * server returns, which is what the Register page persists to localStorage.
 */
export function otpSuccessFor(personaKey) {
  const persona = personas[personaKey];
  return {
    success: true,
    apiToken: makeToken(persona),
    LoginUser: loginUserFor(persona),
  };
}

/** Token strings that must NOT unlock a protected route. */
export const badTokens = {
  /** exp is 10 minutes in the past. */
  expired: makeToken(personas.freeUser, { expiresInSeconds: -600 }),
  /** Not a JWT at all — atob(parts[1]) throws. */
  garbage: 'not-a-real-token',
  /** Right number of segments, but the payload is not valid base64 JSON. */
  malformedPayload: 'aaa.@@@notbase64@@@.bbb',
};

/* ────────────────────────────────────────────────────────────────────────────
 * Fake backend — a small mutable state object the route handlers read from,
 * so a test can adjust `app.api.urls` / `app.api.plan` / `app.api.loginResult`
 * before navigating.
 * ──────────────────────────────────────────────────────────────────────────── */
function defaultApiState() {
  return {
    urls: [
      {
        _id: '650000000000000000000002',
        originalUrl: 'https://example.com/spring-launch',
        shortCode: 'exmp12',
        clicks: 42,
        preClicks: 8,
        active: true,
        createdAt: '2026-01-05T09:00:00.000Z',
        clickLogs: [],
        preClickLogs: [],
        labels: [],
        campaigns: [],
      },
    ],
    labels: {},
    campaigns: [],
    plan: {
      unlimitedLinks: false,
      freeLinkLimit: 1,
      freeCampaignLimit: 1,
      linksCount: 1,
      campaignsCount: 0,
      subscriptionStatus: 'none',
    },
    /** Set by a test to control what the auth endpoints return. */
    loginResult: { success: false, message: 'Invalid email or password.' },
    registerResult: { success: true },
    otpResult: { success: false, message: 'Invalid or expired code.' },
    sendResetOtpResult: { success: true },
    resetPasswordResult: { success: true },
    /** POST /public/verify/:code — { status, body } the password screen gets back. */
    publicVerify: {
      status: 401,
      body: { success: false, message: 'Incorrect password. Please try again.' },
    },
    /** Sanity result rows the Blog page renders. */
    blogPosts: [],
    /** When set, POST /urls returns this instead of really creating a link. */
    createResult: null,
  };
}

/**
 * The backend origin the app talks to (VITE_API_BASE_URL). Scoping every mock
 * to this origin keeps them off the Vite dev server's own `/src/api/*.js`
 * module requests, which also contain "/api/".
 */
export const BACKEND_ORIGIN = 'http://localhost:6090';
const api = (suffix) => new RegExp(`${BACKEND_ORIGIN.replace(/[.]/g, '\\.')}/api${suffix}`);

async function installBackend(page, state) {
  const json = (route, body, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  // Socket.IO would otherwise spam connection errors against a dead backend.
  await page.route(/socket\.io/, (route) => route.abort());

  // Third parties the app pulls in that the tests never need. Left to real
  // network they can stall the page's `load` event (badly so under --headed
  // with parallel workers), timing out navigation. Cut them off deterministically.
  await page.route(
    /(fonts\.googleapis\.com|fonts\.gstatic\.com|accounts\.google\.com|apis\.google\.com)/,
    (route) => route.abort(),
  );

  // Sanity (the blog CMS). Answer with an empty result set so the Blog page
  // renders its shell cleanly instead of logging a fetch failure.
  await page.route(/\.sanity\.io/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ms: 0, query: '', result: state.blogPosts }),
    }),
  );

  // Catch-all so an unmocked backend call fails harmlessly rather than hanging
  // the page. Registered first => lowest priority.
  await page.route(api('/'), (route) => json(route, { success: false, message: 'unmocked endpoint' }));

  await page.route(api('/auth/login'), (route) => json(route, state.loginResult));
  await page.route(api('/auth/register'), (route) => json(route, state.registerResult));
  await page.route(api('/auth/verify-otp'), (route) => json(route, state.otpResult));
  await page.route(api('/auth/send-reset-otp'), (route) => json(route, state.sendResetOtpResult));
  await page.route(api('/auth/reset-password'), (route) => json(route, state.resetPasswordResult));

  await page.route(api('/plan'), (route) => json(route, { success: true, ...state.plan }));

  await page.route(api('/auth/labels'), (route) =>
    json(route, { success: true, labels: state.labels }),
  );

  await page.route(api('/campaigns'), (route) =>
    json(route, { success: true, campaigns: state.campaigns }),
  );

  // POST /public/verify/:shortCode — the password-protected link check.
  await page.route(api('/public/verify/[^/]+'), (route) => {
    const { status, body } = state.publicVerify;
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });

  // GET /urls (list) and POST /urls (create).
  await page.route(api('/urls(\\?.*)?$'), (route) => {
    if (route.request().method() === 'GET') {
      return json(route, {
        success: true,
        urls: state.urls,
        labels: state.labels,
        unlimitedLinks: state.plan.unlimitedLinks,
        subscriptionStatus: state.plan.subscriptionStatus,
      });
    }

    // POST — create. A test can force a specific response via `api.createResult`
    // (e.g. a server-side rejection); otherwise the link is really appended so
    // the next GET /urls reflects it, like the real backend.
    if (state.createResult) return json(route, state.createResult);

    const body = (() => {
      try {
        return route.request().postDataJSON() || {};
      } catch {
        return {};
      }
    })();

    const n = state.urls.length + 1;
    const created = {
      _id: `created-${n}`,
      originalUrl: body.originalUrl || 'https://example.com/new',
      shortCode: body.customAlias || `gen${n}`,
      clicks: 0,
      preClicks: 0,
      active: true,
      password: body.password || undefined,
      expiresAt: body.expiresAt || undefined,
      createdAt: new Date().toISOString(),
      clickLogs: [],
      preClickLogs: [],
      labels: [],
      campaigns: [],
    };
    state.urls = [created, ...state.urls];
    state.plan.linksCount = state.urls.length;
    return json(route, { success: true, url: created });
  });

  // /urls/:slug and /urls/:slug/toggle|labels|campaigns — toggle/delete/patch.
  await page.route(api('/urls/[^/]+'), (route) => {
    if (route.request().method() === 'DELETE') return json(route, { success: true });
    return json(route, { success: true, url: { active: false } });
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * The `app` fixture.
 * ──────────────────────────────────────────────────────────────────────────── */
export const test = base.extend({
  app: async ({ page, baseURL }, use) => {
    const state = defaultApiState();
    await installBackend(page, state);

    const app = {
      api: state,

      /**
       * Write an arbitrary session to localStorage before the app boots — the
       * same keys the real login/OTP flows write. Pass `user: null` to seed a
       * token with no accompanying user object.
       *
       * Must be called before the first navigation (installs an init script).
       */
      async seedSession({ token, user }) {
        await page.addInitScript(
          ({ t, u }) => {
            if (t == null) {
              localStorage.removeItem('apiToken');
              localStorage.removeItem('token');
            } else {
              localStorage.setItem('apiToken', t);
              localStorage.setItem('token', t);
            }
            if (u == null) {
              localStorage.removeItem('LoginUser');
              localStorage.removeItem('user');
            } else {
              localStorage.setItem('LoginUser', u);
              localStorage.setItem('user', u);
            }
          },
          { t: token ?? null, u: user === undefined ? null : user },
        );
      },

      /**
       * Seed a valid signed-in session for a persona. `expiresInSeconds` can be
       * negative to simulate an already-expired token.
       */
      async signIn(personaKey, { expiresInSeconds } = {}) {
        const persona = personas[personaKey];
        if (!persona) throw new Error(`Unknown persona: ${personaKey}`);

        // Keep the fake backend's plan consistent with the persona: GET /urls
        // reports the live quota and the app trusts it over the token claim.
        const unlimited = Boolean(persona.claims.isOwner || persona.claims.isPremium);
        state.plan.unlimitedLinks = unlimited;
        state.plan.subscriptionStatus =
          persona.claims.isPremium ? 'active' : 'none';

        await app.seedSession({
          token: makeToken(persona, expiresInSeconds ? { expiresInSeconds } : {}),
          user: JSON.stringify(loginUserFor(persona)),
        });
        return persona;
      },

      /**
       * Navigate to an app path (relative — resolved against baseURL).
       *
       * Waits for `domcontentloaded`, not `load`: this is a client-rendered SPA,
       * so the meaningful content arrives after DCL anyway, and waiting for the
       * full `load` event makes navigation hostage to slow third-party assets.
       */
      async goto(path, options) {
        return page.goto(path, { waitUntil: 'domcontentloaded', ...options });
      },

      baseURL,
    };

    await use(app);
  },
});

export { expect };
