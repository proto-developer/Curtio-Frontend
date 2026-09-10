# Curtio Frontend

React frontend for **[Curtio](https://curtio.io)** — a URL shortener with click analytics, campaigns, QR codes, and Sanity-powered blog content.

Companion API: [`Curtio-Backend`](../Curtio-Backend) (default `http://localhost:6090`).

## Stack

- React 19 + Vite 8
- React Router 7
- Tailwind CSS 4
- Socket.IO client (live updates)
- Sanity (blog)
- Recharts, Vitest, Playwright

## Quick start

```bash
npm install
cp .env.example .env   # fill in values (see Environment)
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

Run the backend separately (port **6090**) so `VITE_API_BASE_URL` resolves.

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API root (e.g. `http://localhost:6090/api`) |
| `VITE_REDIRECT_URI` | Short-link / redirect base (e.g. `http://localhost:6090`) |
| `VITE_CLIENT_ID` | Google OAuth client ID |
| `VITE_SANITY_PROJECT_ID` | Sanity project |
| `VITE_SANITY_DATASET` | Sanity dataset (e.g. `production`) |
| `VITE_SANITY_API_VERSION` | Sanity API version |
| `VITE_SANITY_API_TOKEN` | Sanity token (if needed for private reads) |
| `VITE_SITE_URL` | Canonical site URL for SEO (optional) |
| `VITE_GOOGLE_API_KEY` | Google API key (optional) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright e2e |

## Testing

| Suite | Command | Notes |
|-------|---------|-------|
| Unit (Vitest) | `npm test` | `src/**/*.test.{js,jsx}`, jsdom. `e2e/` is excluded. |
| E2E (Playwright) | `npm run test:e2e` | Browser tests in `e2e/`, Chromium only. |

### Running the e2e suite

```bash
cp .env.example .env            # once — Vite needs the VITE_* values
npx playwright install chromium # once — download the browser
npm run test:e2e
```

- **No backend required.** Every API/socket call is stubbed in [`e2e/fixtures.js`](e2e/fixtures.js); Playwright starts the Vite dev server itself.
- `npm run test:e2e -- --headed` to watch it run (drops to 2 workers automatically), `--ui` for the Playwright UI, `--debug` to step through.
- `npx playwright show-report` opens the last HTML report; failures also keep a trace (`npx playwright show-trace <file>`).
- Shared personas, routes, and the mock backend live in `e2e/fixtures.js`; `e2e/global-setup.js` pre-warms routes so the dev server isn't cold when workers start.

### CI

- **Unit tests** run on every PR/push to `main`/`prod` via [`.github/workflows/unit-tests.yml`](.github/workflows/unit-tests.yml).
- **E2E tests** run alongside them via [`.github/workflows/e2e-tests.yml`](.github/workflows/e2e-tests.yml) — same triggers, separate job. On failure it uploads `playwright-report/` and `test-results/` (traces, screenshots, videos) as run artifacts, and annotates the failing lines on the PR.

## Project structure

```
src/
  api/          # HTTP clients (auth, urls, plan, public)
  components/   # Shared UI
  config/       # Env + shortener config
  features/     # Route-level modules (auth, links, analytics, …)
  lib/          # Session, sync, Sanity, helpers
  seo/          # Meta / SEO helpers
  socket/       # Socket.IO provider
```

Path alias: `@/*` → `src/*` (see `jsconfig.json` + Vite `resolve.alias`).

## Docs

- [`docs/DEVELOPER_DOCS.md`](docs/DEVELOPER_DOCS.md) — product and architecture notes
