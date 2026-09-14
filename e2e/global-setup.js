import { chromium } from '@playwright/test';

/**
 * Warm the Vite dev server before the workers start.
 *
 * Vite compiles route modules on first request. With `--headed` and several
 * parallel workers, four cold page loads hit the dev server at once and the
 * first few navigations can blow their timeout. Loading every route once here
 * — including the authenticated ones — means the workers only ever hit
 * already-compiled modules.
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/pricing',
  '/features',
  '/accuracy',
  '/terms-of-service',
  '/privacy-policy',
  '/refund-policy',
  '/shipping-policy',
  '/blog',
  '/password/warmup',
];

const AUTHED_ROUTES = [
  '/dashboard',
  '/dashboard/analytics',
  '/dashboard/campaigns',
  '/dashboard/preclick',
  '/dashboard/editprofile',
  '/analytics/warmup',
];

export default async function globalSetup(config) {
  const baseURL =
    config.projects?.[0]?.use?.baseURL || 'http://localhost:5173';

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL });

    // A structurally valid owner token + stubbed backend, so ProtectedRoute and
    // OwnerRoute render their lazy children instead of bouncing to /login.
    await context.addInitScript(() => {
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 86400, isOwner: true }),
      );
      const token = `warm.${payload}.sig`;
      localStorage.setItem('apiToken', token);
      localStorage.setItem('token', token);
      localStorage.setItem(
        'LoginUser',
        JSON.stringify({ name: 'Warmup', email: 'warmup@curtio.test', isOwner: true }),
      );
    });
    await context.route(/localhost:6090|socket\.io/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, urls: [], labels: {}, campaigns: [] }),
      }),
    );
    await context.route(
      /fonts\.googleapis\.com|fonts\.gstatic\.com|accounts\.google\.com|apis\.google\.com/,
      (route) => route.abort(),
    );
    await context.route(/\.sanity\.io/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"result":[]}' }),
    );

    const page = await context.newPage();
    for (const path of [...PUBLIC_ROUTES, ...AUTHED_ROUTES]) {
      try {
        await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 });
        // Wait for the route's full lazy-chunk graph (recharts, icon packs, …)
        // to be requested and compiled, not just the HTML shell.
        await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {});
      } catch {
        /* best-effort warmup — a miss here just means that route stays cold */
      }
    }
  } finally {
    await browser.close();
  }
}
