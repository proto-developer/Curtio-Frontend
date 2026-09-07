# Curtio — Developer Documentation

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** Frontend complete · Backend required

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Application Architecture](#3-application-architecture)
4. [Pages & Modules](#4-pages--modules)
   - 4.1 [Landing Page](#41-landing-page)
   - 4.2 [Register](#42-register)
   - 4.3 [Login](#43-login)
   - 4.4 [Dashboard](#44-dashboard)
   - 4.5 [Analytics](#45-analytics)
   - 4.6 [Blog List](#46-blog-list)
   - 4.7 [Blog Post](#47-blog-post)
5. [Data Models](#5-data-models)
6. [API Endpoints Required](#6-api-endpoints-required)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Business Logic & Rules](#8-business-logic--rules)
9. [Feature Specifications](#9-feature-specifications)
   - 9.1 [URL Shortening (Guest)](#91-url-shortening-guest)
   - 9.2 [URL Shortening (Authenticated)](#92-url-shortening-authenticated)
   - 9.3 [Link Analytics](#93-link-analytics)
   - 9.4 [QR Code Generation](#94-qr-code-generation)
   - 9.5 [UTM Builder](#95-utm-builder)
   - 9.6 [Password Protection](#96-password-protection)
   - 9.7 [Link Expiration](#97-link-expiration)
10. [Redirect Service](#10-redirect-service)
11. [Rate Limiting](#11-rate-limiting)
12. [Frontend ↔ Backend Contract](#12-frontend--backend-contract)
13. [Environment Variables](#13-environment-variables)
14. [Deployment Notes](#14-deployment-notes)

---

## 1. Project Overview

**Curtio** is a free link shortening and analytics SaaS. Users can shorten URLs, track clicks with detailed analytics, generate QR codes, and configure advanced link settings (UTM parameters, password protection, expiration dates).

### Core Value Proposition

| User Type | What They Get |
|-----------|---------------|
| Guest (no account) | Instant URL shortening, up to 5 links/day. No analytics. |
| Free Account | 1 fully tracked link with complete analytics. |

### Competitive Positioning

Curtio is positioned as the "always free, no credit card, genuinely useful" link shortener. The free tier is intentionally generous for individual users (one link with full analytics), making it a credible alternative to Bitly, Cuttly, and similar tools for personal use.

---

## 2. Tech Stack

### Frontend (Current)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Language | JavaScript (JSX) |

### Backend (To Be Built)
| Layer | Recommended Technology |
|-------|----------------------|
| Runtime | Node.js (Express) or Python (FastAPI/Django) |
| Database | PostgreSQL (primary data) |
| Cache / Rate Limit | Redis |
| Auth | JWT (access + refresh tokens) or session-based |
| Short URL redirect | Standalone lightweight service (see Section 10) |
| File storage (QR) | S3 or Cloudflare R2 |
| Email | Resend, SendGrid, or Postmark |

---

## 3. Application Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (React SPA)                │
│  Landing → Register/Login → Dashboard → Analytics  │
│  Blog List → Blog Post                              │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / REST API
┌────────────────────▼────────────────────────────────┐
│                  BACKEND API SERVER                 │
│  Auth · Links · Analytics · Users · Blog            │
└──────┬──────────────────────────────────┬───────────┘
       │                                  │
┌──────▼──────┐                  ┌────────▼──────────┐
│  PostgreSQL │                  │      Redis        │
│  (primary)  │                  │  (rate limiting,  │
└─────────────┘                  │   session cache)  │
                                 └───────────────────┘
┌─────────────────────────────────────────────────────┐
│            REDIRECT SERVICE (edge / CDN)            │
│  redirect.curtio.io/:slug → lookup → redirect with analytics  │
└─────────────────────────────────────────────────────┘
```

The **redirect service** is intentionally separate from the main API because it must be extremely fast (<50ms) and handles high-volume read traffic. It should be deployed at the edge (Cloudflare Workers, Vercel Edge, or a lightweight Node process behind a CDN).

---

## 4. Pages & Modules

### 4.1 Landing Page

**Route:** `/`  
**File:** `src/pages/Landing.jsx`

#### What it does
- Marketing page explaining Curtio's value proposition.
- Contains a functional URL shortener form (guest usage).
- Shows the Free vs. Free Account tier comparison.
- Displays features, stats, and a CTA to register.

#### Guest shortener behavior
1. User pastes a URL and clicks "Shorten".
2. Frontend validates the URL format (must include protocol).
3. Frontend calls `POST /api/links/guest` (unauthenticated).
4. Backend validates the URL, creates a short link tagged as `guest: true`, returns the slug.
5. Frontend displays the short URL.
6. After shortening, a contextual message tells the user this link is **not tracked** and invites them to sign up.

#### Backend requirements
- Accept `POST /api/links/guest` with `{ url: string }`.
- Apply rate limiting by IP: max 5 guest links per IP per 24 hours.
- Return `{ slug, shortUrl }`.

---

### 4.2 Register

**Route:** `/register`  
**File:** `src/pages/Register.jsx`

#### Form fields
| Field | Validation |
|-------|-----------|
| Full Name | Required, 2–100 chars |
| Email | Required, valid email format, unique |
| Password | Required, min 8 chars |
| Terms checkbox | Must be checked |

#### Password strength meter
Frontend computes a 0–4 strength score based on: length ≥8, uppercase present, number present, special char present. Visual bar shown while typing.

#### Google OAuth
"Continue with Google" button is present in the UI. Requires Google OAuth 2.0 integration on the backend (see Section 7).

#### Backend requirements
- `POST /api/auth/register` — create user, hash password (bcrypt, cost ≥12), send verification email, return JWT.
- `POST /api/auth/google` — handle Google OAuth token exchange.
- Email uniqueness enforced at DB level (unique index on `users.email`).

---

### 4.3 Login

**Route:** `/login`  
**File:** `src/pages/Login.jsx`

#### Form fields
| Field | Validation |
|-------|-----------|
| Email | Required, valid email |
| Password | Required |

#### Backend requirements
- `POST /api/auth/login` — verify credentials, return `{ accessToken, refreshToken, user }`.
- `POST /api/auth/refresh` — exchange refresh token for new access token.
- `POST /api/auth/logout` — invalidate refresh token.
- `POST /api/auth/forgot-password` — send reset email.
- `POST /api/auth/reset-password` — consume reset token, update password.

---

### 4.4 Dashboard

**Route:** `/dashboard`  
**File:** `src/pages/Dashboard.jsx`  
**Auth required:** Yes (redirect to `/login` if not authenticated)

#### Modules

**Stats Cards**
- Total Links count
- Total Clicks (sum of all link clicks)
- Average CTR (calculated server-side or frontend from analytics data)

**Free Plan Usage Indicator**
- Sidebar shows `{linksUsed}/{FREE_LIMIT}` with a progress bar.
- When limit is reached, "New Link" button is disabled and a warning banner is shown.
- Current `FREE_LIMIT = 1` (one tracked link per free account).

**Create Link Form**
Shown when user clicks "New Link" (only if under the limit).

Basic fields:
- `url` (required) — destination URL
- `alias` (optional) — custom slug (alphanumeric + hyphens only, 3–50 chars)

Advanced fields (collapsed by default, revealed via toggle):
- **UTM Builder** — source, medium, campaign (appended to destination URL before saving)
- **Password** — optional plaintext password; stored hashed on backend
- **Expiration** — datetime-local input; stored as UTC timestamp

**Links Table**
Each row shows: short URL, destination (truncated), click count, active toggle, action buttons.

Action buttons per link:
| Button | Action |
|--------|--------|
| Copy | Write `https://{shortUrl}` to clipboard |
| QR Code | Open QR modal |
| Analytics | Navigate to `/analytics/:id` |
| Open | Open destination URL in new tab |
| Delete | `DELETE /api/links/:id`, remove from list |

**QR Code Modal**
- Renders an SVG QR code representation of the short URL.
- **Backend must generate real QR codes** — frontend currently renders a placeholder SVG. Backend should use a QR library (e.g., `qrcode` npm package) and return an SVG or PNG data URL.
- Modal offers "Download SVG" button.

#### Backend requirements
- `GET /api/links` — return all links for authenticated user.
- `POST /api/links` — create a new link (subject to free-tier limit check).
- `PATCH /api/links/:id` — update alias, active state, password, expiry, destination.
- `DELETE /api/links/:id` — delete a link (and its analytics data).
- `GET /api/links/:id/qr` — return QR code as SVG or PNG for the link.
- `GET /api/user/stats` — return `{ totalLinks, totalClicks, avgCtr }` for the dashboard stat cards.

---

### 4.5 Analytics

**Route:** `/analytics/:id`  
**File:** `src/pages/Analytics.jsx`  
**Auth required:** Yes

#### Charts & Data Panels
| Panel | Data | Chart Type |
|-------|------|-----------|
| Clicks Over Time | clicks per day for last 7 days | Area chart (Recharts) |
| Top Referrers | source → visit count | Horizontal bar chart |
| Device Breakdown | mobile/desktop/tablet % | Donut pie chart |
| Top Countries | country → click count + bar | Custom bar list |

#### Stat Pills
- Total Clicks
- This Week (clicks in last 7 days)
- Countries (unique country count)
- Mobile Share (% of mobile clicks)

#### Backend requirements
- `GET /api/links/:id/analytics` — return aggregate analytics:
  ```json
  {
    "totalClicks": 4821,
    "weekClicks": 1870,
    "uniqueCountries": 32,
    "mobileShare": 54,
    "clickHistory": [
      { "date": "2026-04-29", "clicks": 380 },
      ...
    ],
    "referrers": [
      { "source": "twitter", "visits": 1842 },
      ...
    ],
    "devices": [
      { "name": "Mobile", "value": 54 },
      { "name": "Desktop", "value": 36 },
      { "name": "Tablet", "value": 10 }
    ],
    "countries": [
      { "country": "United States", "code": "US", "clicks": 2104 },
      ...
    ]
  }
  ```
- Analytics data is collected at redirect time (see Section 10).

---

### 4.6 Blog List

**Route:** `/blog`  
**File:** `src/pages/Blog.jsx`  
**Auth required:** No

#### Features
- Hero with title and tagline.
- Featured post (first post with `featured: true`) shown as a large card.
- Category filter pills (All, Marketing, Analytics, Tips & Tricks, Product).
- Post grid (2 columns on desktop, 1 on mobile).

#### Backend requirements (if blog is dynamic)
- `GET /api/blog/posts?category=X&page=N` — paginated list of posts.
- Response: `{ posts: [...], total, page, pages }`.
- Each post: `{ id, slug, title, excerpt, category, author, date, readTime, coverColor, featured }`.
- **Alternative:** Blog can remain static/hardcoded (current approach with `mockBlog.js`) or be driven by a CMS (Contentful, Sanity, Notion API). If static, no backend work needed for blog.

---

### 4.7 Blog Post

**Route:** `/blog/:slug`  
**File:** `src/pages/BlogPost.jsx`  
**Auth required:** No

#### Features
- Gradient cover image (driven by `coverColor` field).
- Renders post body as structured HTML (headings, paragraphs, lists, tables, inline code).
- Author metadata, date, read time.
- End-of-post CTA card linking to `/register`.
- "More from the blog" section with 2 related posts.

#### Backend requirements
- `GET /api/blog/posts/:slug` — return full post including `content` (Markdown or HTML string).
- If CMS-driven, this is a proxy to the CMS API.

---

## 5. Data Models

### User
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255),           -- bcrypt hash; NULL for OAuth users
  google_id   VARCHAR(255) UNIQUE,    -- for Google OAuth
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Link
```sql
CREATE TABLE links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  slug         VARCHAR(100) UNIQUE NOT NULL,
  destination  TEXT NOT NULL,
  is_guest     BOOLEAN DEFAULT FALSE,        -- true for guest (unauthenticated) links
  is_active    BOOLEAN DEFAULT TRUE,
  password     VARCHAR(255),                 -- bcrypt hash; NULL if not protected
  expires_at   TIMESTAMPTZ,                  -- NULL = never expires
  utm_source   VARCHAR(255),
  utm_medium   VARCHAR(255),
  utm_campaign VARCHAR(255),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON links(slug);
CREATE INDEX ON links(user_id);
```

> **Note on UTM:** UTM parameters are appended to the destination URL *before storing*. The `utm_*` columns are stored separately for reference/display, but the actual redirect destination already includes the UTM query string.

### Click (Analytics event)
```sql
CREATE TABLE clicks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id     UUID REFERENCES links(id) ON DELETE CASCADE,
  clicked_at  TIMESTAMPTZ DEFAULT NOW(),
  ip_hash     VARCHAR(64),      -- SHA-256 of IP, never store raw IP
  country     VARCHAR(2),       -- ISO 3166-1 alpha-2
  city        VARCHAR(100),
  referrer    TEXT,
  device      VARCHAR(20),      -- 'mobile' | 'desktop' | 'tablet'
  browser     VARCHAR(50),
  os          VARCHAR(50),
  user_agent  TEXT
);

CREATE INDEX ON clicks(link_id);
CREATE INDEX ON clicks(clicked_at);
```

### Blog Post (if DB-driven)
```sql
CREATE TABLE blog_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(200) UNIQUE NOT NULL,
  title       VARCHAR(300) NOT NULL,
  excerpt     TEXT,
  content     TEXT NOT NULL,            -- Markdown
  category    VARCHAR(100),
  author_name VARCHAR(100),
  author_role VARCHAR(100),
  read_time   VARCHAR(20),
  cover_color VARCHAR(100),
  featured    BOOLEAN DEFAULT FALSE,
  published   BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. API Endpoints Required

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Login, return tokens |
| POST | `/api/auth/logout` | Bearer | Invalidate refresh token |
| POST | `/api/auth/refresh` | None | Refresh access token |
| POST | `/api/auth/google` | None | Google OAuth exchange |
| POST | `/api/auth/forgot-password` | None | Send reset email |
| POST | `/api/auth/reset-password` | None | Reset password with token |
| GET  | `/api/auth/me` | Bearer | Get current user info |

### Links
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/links/guest` | None | Create guest (untracked) link |
| GET  | `/api/links` | Bearer | List user's links |
| POST | `/api/links` | Bearer | Create tracked link (subject to free limit) |
| PATCH | `/api/links/:id` | Bearer | Update link (destination, alias, active, password, expiry) |
| DELETE | `/api/links/:id` | Bearer | Delete link + its analytics |
| GET  | `/api/links/:id/qr` | Bearer | Get QR code SVG/PNG |
| GET  | `/api/links/:id/analytics` | Bearer | Get analytics for a link |

### User
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/user/stats` | Bearer | Dashboard stat cards |
| PATCH | `/api/user/profile` | Bearer | Update name, email |
| DELETE | `/api/user` | Bearer | Delete account + all links |

### Blog (if dynamic)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/blog/posts` | None | List published posts (paginated) |
| GET | `/api/blog/posts/:slug` | None | Get single post by slug |

### Redirect (separate service — see Section 10)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:slug` | None | Resolve slug → redirect |

---

## 7. Authentication & Authorization

### Token Strategy
- **Access Token:** JWT, short-lived (15 minutes), signed with `ACCESS_TOKEN_SECRET`.
- **Refresh Token:** Opaque token (UUID), long-lived (30 days), stored in DB and in an `httpOnly` cookie.
- On each authenticated request, frontend sends `Authorization: Bearer <accessToken>`.
- When the access token expires, frontend calls `POST /api/auth/refresh` using the cookie.

### Google OAuth Flow
1. Frontend redirects to `GET /api/auth/google/redirect` (backend-initiated OAuth flow).
2. User authenticates with Google.
3. Google redirects back to `GET /api/auth/google/callback`.
4. Backend exchanges code for Google profile, creates or finds user, returns JWT.
5. Frontend receives tokens via redirect URL query params or a short-lived code.

### Route Protection (Frontend)
The frontend currently has no auth guard. Backend should return `401 Unauthorized` for authenticated endpoints when the token is missing or expired. Frontend should intercept 401s and redirect to `/login`.

**Implementation needed in frontend:** A `ProtectedRoute` wrapper component that checks for a stored token before rendering `/dashboard` and `/analytics/:id`.

### Resource Authorization
- Users can only access their own links and analytics.
- All link endpoints must verify `link.user_id === req.user.id`.

---

## 8. Business Logic & Rules

### Free Tier Limits
| Rule | Value | Enforcement |
|------|-------|-------------|
| Max tracked links per free account | **1** | Enforced in `POST /api/links`: count user's existing links; reject with `403` if at limit |
| Guest link rate limit | 5 per IP per 24 hours | Enforced via Redis counter keyed by IP |
| Guest links are not tracked | Guest clicks are not saved to the `clicks` table | Redirect service checks `is_guest` flag |
| Analytics data retention | Unlimited on free tier | No expiry needed for MVP |

### Slug Generation
- If the user provides a custom alias: validate it is 3–50 chars, `[a-zA-Z0-9-]` only, unique in the `links` table.
- If no alias provided: generate a 6-character random alphanumeric slug (e.g., `a3b9c2`). Retry on collision (extremely rare with 6 chars = 2.1 billion combinations).
- Reserved slugs (must not be allowed as aliases): `api`, `blog`, `login`, `register`, `dashboard`, `analytics`, `admin`, `static`, `health`.

### Link Expiration
- At redirect time, check `links.expires_at`. If `expires_at IS NOT NULL AND expires_at < NOW()`, do not redirect — return an "expired" response (HTTP 410 Gone).
- Frontend shows a friendly expired page.

### Password Protection
- At redirect time, if `links.password IS NOT NULL`, do not redirect immediately. Instead, serve a password form page.
- User submits the password; backend verifies with `bcrypt.compare(submitted, stored_hash)`. On success, redirect. On failure, return 403.
- This password challenge is entirely on the redirect service.

### Active/Inactive Toggle
- If `links.is_active = false`, the redirect service returns HTTP 404 (or a "link deactivated" page).

---

## 9. Feature Specifications

### 9.1 URL Shortening (Guest)

**Trigger:** User submits a URL on the landing page without being logged in.

**Frontend flow:**
1. Validate URL format (must pass `new URL(str)` check).
2. `POST /api/links/guest` with `{ url }`.
3. Display the shortened URL.
4. Show a contextual message: "This link is not tracked. Sign up to track clicks."

**Backend flow:**
1. Validate URL (must be http/https; block localhost, private IPs, known malware domains).
2. Check Redis rate limit: `INCR guest:{ip}` with `EXPIRE 86400`.
3. Generate slug (6-char random).
4. Insert into `links` with `is_guest=true, user_id=NULL`.
5. Return `{ shortUrl: "https://redirect.curtio.io/{slug}" }`.

---

### 9.2 URL Shortening (Authenticated)

**Trigger:** Logged-in user submits the create-link form in the dashboard.

**Frontend form fields sent:**
```json
{
  "url": "https://example.com/long-path",
  "alias": "my-link",
  "password": "secret123",
  "expiresAt": "2026-12-31T23:59:00",
  "utm": {
    "source": "twitter",
    "medium": "social",
    "campaign": "launch"
  }
}
```

**Backend flow:**
1. Verify access token.
2. Count user's existing links. If count ≥ `FREE_LIMIT` (1), return `403 { error: "free_limit_reached" }`.
3. Build final destination URL: append UTM params if provided.
4. Validate/reserve slug (custom or auto-generated).
5. Hash password if provided: `bcrypt.hash(password, 12)`.
6. Insert link record.
7. Return full link object.

---

### 9.3 Link Analytics

**Data collected at redirect time (see Section 10):**
- `clicked_at`: current UTC timestamp
- `ip_hash`: SHA-256 of the visitor's IP (never store raw IP for privacy)
- `country` + `city`: resolved via IP geolocation (MaxMind GeoLite2 or ipapi.co)
- `referrer`: from `Referer` HTTP header
- `device`, `browser`, `os`: parsed from `User-Agent` header (use `ua-parser-js` or equivalent)

**Analytics API aggregation (`GET /api/links/:id/analytics`):**
- Group clicks by date for time-series chart.
- Group by `referrer`, normalize to domain only (e.g., `https://twitter.com/...` → `twitter.com`).
- Group by `device`.
- Group by `country`, sort by count descending, return top 10.
- Calculate `mobileShare` as `(mobile_clicks / total_clicks) * 100`.

---

### 9.4 QR Code Generation

**Trigger:** User clicks the QR icon on a dashboard link row.

**Frontend:** Opens a modal. Calls `GET /api/links/:id/qr` to get the QR code.

**Backend:**
1. Look up link by ID (verify ownership).
2. Generate QR code for `https://redirect.curtio.io/{slug}` using a QR library.
3. Return SVG string or PNG base64.
4. Optionally cache the QR code in S3/R2 keyed by slug (avoids regeneration).

**Recommended library:** `qrcode` (npm) — supports SVG output, error correction levels, and custom colors.

---

### 9.5 UTM Builder

**This is a purely frontend feature.** The frontend constructs the final URL string before sending it to the backend.

**Logic (already implemented in frontend):**
```js
function buildFinalUrl(base, { source, medium, campaign }) {
  const params = []
  if (source)   params.push(`utm_source=${encodeURIComponent(source)}`)
  if (medium)   params.push(`utm_medium=${encodeURIComponent(medium)}`)
  if (campaign) params.push(`utm_campaign=${encodeURIComponent(campaign)}`)
  if (!params.length) return base
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}${params.join('&')}`
}
```

The backend receives and stores the final URL with UTM params already appended. The `utm_source`, `utm_medium`, `utm_campaign` fields on the `links` table store the original values for display purposes only.

---

### 9.6 Password Protection

**At redirect time:**
1. Redirect service looks up slug.
2. If `link.password != NULL`:
   a. Serve an HTML password form page (can be a separate Next.js page or a static HTML served by the redirect service).
   b. User submits the password via POST to `/:slug/verify`.
   c. Backend: `bcrypt.compare(submitted, link.password)`. On match, set a short-lived signed cookie (`brevly_auth_{slug}`) and redirect. On failure, serve the form again with an error message.
3. On subsequent visits: if the cookie is present and valid, redirect directly.

---

### 9.7 Link Expiration

**At redirect time:**
1. Retrieve link by slug.
2. If `link.expires_at IS NOT NULL`:
   - Compare to `NOW()` (UTC).
   - If expired: return HTTP 410 Gone with a friendly HTML page ("This link has expired").
   - If not expired: proceed with redirect.
3. Cron job (optional): run nightly to set `is_active = false` on all expired links so the dashboard toggles correctly.

---

## 10. Redirect Service

This is the most performance-critical component. Every time a user clicks a Curtio short link, this service runs.

### Requirements
- **Latency target:** < 50ms p99.
- **Uptime:** 99.9%+.
- Completely stateless; reads from DB/cache only.

### Recommended Architecture
```
User clicks redirect.curtio.io/abc123
       ↓
Cloudflare/CDN (edge cache for popular slugs)
       ↓
Redirect Worker (Cloudflare Worker or Vercel Edge Function)
       ↓
Redis cache (slug → { destination, is_active, expires_at, password, is_guest })
       ↓ (cache miss only)
PostgreSQL (read replica)
       ↓
HTTP 301/302 to destination
       ↓ (async, non-blocking)
Analytics queue (Redis or message queue → async worker writes to `clicks` table)
```

### Redirect Type
- Use **HTTP 302 (temporary redirect)** for all links, not 301. This prevents browsers from caching the redirect, which is important when users update the destination URL.

### Click Recording (Async)
Recording a click **must not block the redirect**. Use one of:
- Redis list as a queue: push click event to Redis, separate worker consumes and writes to DB.
- Message queue (BullMQ, RabbitMQ, SQS): enqueue click event, worker processes async.
- At minimum: respond to the user with the redirect immediately, then `await` the DB write in the background (works for low traffic, not recommended for production).

### Click Data to Record
```json
{
  "link_id": "uuid",
  "clicked_at": "2026-05-05T12:34:56Z",
  "ip_hash": "sha256(ip + SALT)",
  "country": "US",
  "city": "New York",
  "referrer": "https://twitter.com",
  "device": "mobile",
  "browser": "Chrome",
  "os": "iOS",
  "user_agent": "Mozilla/5.0 ..."
}
```

---

## 11. Rate Limiting

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /api/links/guest` | 5 | 24 hours | IP address |
| `POST /api/auth/login` | 10 | 15 minutes | IP address |
| `POST /api/auth/register` | 5 | 1 hour | IP address |
| `POST /api/auth/forgot-password` | 3 | 1 hour | IP + email |
| `GET /api/links/:id/analytics` | 60 | 1 minute | User ID |
| `GET /:slug` (redirect) | 1000 | 1 minute | IP address |
| All other authenticated API routes | 100 | 1 minute | User ID |

Implement using Redis with the sliding window algorithm. Return `HTTP 429 Too Many Requests` with a `Retry-After` header.

---

## 12. Frontend ↔ Backend Contract

### Authentication Headers
```
Authorization: Bearer <accessToken>
```

### Standard Error Response Shape
```json
{
  "error": "error_code",
  "message": "Human-readable description",
  "details": {}
}
```

### Common Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `invalid_credentials` | 401 | Wrong email or password |
| `token_expired` | 401 | JWT has expired |
| `token_invalid` | 401 | Malformed JWT |
| `unauthorized` | 403 | Authenticated but not permitted (e.g., wrong user's link) |
| `free_limit_reached` | 403 | User has hit the 1-link free tier limit |
| `slug_taken` | 409 | Custom alias already in use |
| `url_invalid` | 422 | URL failed validation |
| `rate_limited` | 429 | Too many requests |
| `not_found` | 404 | Resource not found |

### Pagination (for future list endpoints)
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20,
    "pages": 5
  }
}
```

### Frontend State Management
Currently all state is local React state (useState). When connecting to the backend:
- Use a global auth state (Context API or Zustand) to hold the current user and token.
- Use React Query or SWR for data fetching, caching, and refetching.
- Store the access token in memory (not localStorage) for security. Store the refresh token in an httpOnly cookie (set by the backend).

---


### Backend (`.env`)
```
DATABASE_URL=postgresql://user:pass@host:5432/brevly
REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_SECRET=your_jwt_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_secret_min_32_chars
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.redirect.curtio.io/api/auth/google/callback
BCRYPT_SALT_ROUNDS=12
IP_SALT=random_secret_for_ip_hashing
GEOIP_DB_PATH=./GeoLite2-City.mmdb
FRONTEND_URL=https://brev.ly
RESEND_API_KEY=your_email_provider_key
FROM_EMAIL=hello@brev.ly
QR_STORAGE_BUCKET=brevly-qr-codes
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## 14. Deployment Notes

### Recommended Architecture
- **Frontend:** Vercel (auto-deploy from git, free tier is sufficient)
- **Backend API:** Railway, Render, or Fly.io (Node.js or Python container)
- **Redirect Service:** Cloudflare Workers (runs at edge globally, 50ms latency target achievable)
- **Database:** Supabase (PostgreSQL + connection pooling) or Railway Postgres
- **Cache:** Upstash Redis (serverless Redis, works with Cloudflare Workers)
- **Email:** Resend (generous free tier)
- **QR Storage:** Cloudflare R2 (free egress)

### Domain Setup
- `brev.ly` — main frontend
- `redirect.curtio.io/:slug` — redirect service (handled by Cloudflare Worker on the root domain)
- `api.brev.ly` — backend API
- `*.brev.ly` — future custom domain support (CNAME pointing to Cloudflare)

### Custom Domain Support (Future)
When users bring their own domain, the flow is:
1. User adds a CNAME: `links.theirdomain.com → brev.ly`
2. Backend stores `{ userId, customDomain: "links.theirdomain.com" }`.
3. Redirect service reads the `Host` header and resolves slugs for that user's links.

---

## Appendix: Feature Roadmap (Prioritized)

Based on competitor analysis (Bitly, Cuttly, Linktree):

| Priority | Feature | Notes |
|----------|---------|-------|
| P0 | QR code generation (real) | Replace frontend placeholder with backend-generated QR |
| P0 | Guest link rate limiting | 5/day per IP via Redis |
| P0 | Free tier limit enforcement | Block link creation at limit, return `free_limit_reached` |
| P1 | Link expiration | Already in UI; needs redirect service check |
| P1 | Password protection | Already in UI; needs redirect service challenge page |
| P1 | UTM parameters | Already in UI; needs backend to store and use |
| P1 | Analytics (real data) | Replace mock data with `clicks` table aggregation |
| P2 | Google OAuth | Integrate Google Sign-In |
| P2 | Custom branded domains | BYOD flow |
| P2 | Analytics CSV export | `GET /api/links/:id/analytics/export` → CSV download |
| P2 | Geo & device targeting redirects | Route different visitors to different destinations |
| P3 | A/B link rotation | Split traffic between multiple destinations |
| P3 | Retargeting pixel injection | Embed FB/Google pixel at redirect time |
| P3 | Team/multi-user access | Multiple seats per account |
| P3 | Bio page / link-in-bio | Public profile page with multiple links |
| P3 | REST API for power users | Documented public API with API keys |
| P4 | Browser extension | Shorten from any page |
| P4 | Bulk link creation (CSV) | Import many links at once |
| P4 | Zapier / Make integration | Via webhook or official Zapier app |
