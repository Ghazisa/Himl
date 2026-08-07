# حِمْل · Himl

A bilingual (Arabic / English) digital freight matching platform that connects
**shippers** (أصحاب البضائع) with **transporters** (أصحاب المركبات) across Saudi Arabia.

Built to the **Saudi Unified Design System** — كود المنصات v1.0, published by the
Digital Government Authority (17 Nov 2024).

> Status: working MVP. Django REST API + React SPA, runs fully on a local machine
> with no cloud services or paid accounts required.

---

## Table of contents

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Email / OTP configuration](#email--otp-configuration)
- [Architecture](#architecture)
- [Core workflow](#core-workflow)
- [API reference](#api-reference)
- [Design system compliance](#design-system-compliance)
- [Frontend stack](#frontend-stack)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)

---

## Quick start

### Prerequisites

Both tools install into your home directory — no administrator rights needed.

| Tool | Version | Installed via |
|---|---|---|
| Python | 3.12 | [`uv`](https://docs.astral.sh/uv/) at `~/.local/bin/uv` |
| Node | 22 | [`nvm`](https://github.com/nvm-sh/nvm) at `~/.nvm` |

If a fresh terminal cannot find them:

```bash
export PATH="$HOME/.local/bin:$PATH" && source "$HOME/.nvm/nvm.sh"
```

### Run it

Two terminals.

**Terminal 1 — backend** → http://127.0.0.1:8000

```bash
cd backend && uv run python manage.py migrate && uv run python manage.py seed_demo && uv run python manage.py runserver
```

**Terminal 2 — frontend** → http://localhost:5173

```bash
cd frontend && npm install && npm run dev
```

Open <http://localhost:5173>.

---

## Demo accounts

Created by `uv run python manage.py seed_demo`. Password for every account: `Himl2026`

| Role | Email |
|---|---|
| Shipper | `shipper@demo.sa` |
| Transporter | `turki@demo.sa` — also `faisal@`, `mohammed@`, `saleh@`, `abdulaziz@`, `nawaf@` |

Django admin lives at <http://127.0.0.1:8000/admin/>; create a login with
`uv run python manage.py createsuperuser`.

---

## Email / OTP configuration

Sign-up sends a 4-digit code by email. **With no configuration the code is printed to
the backend terminal** instead of being sent, so the whole flow is testable without
secrets.

To send real mail through Gmail, create `backend/.env`:

```
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
```

Generate the app password at Google Account → Security → 2-Step Verification → App
passwords. It is **not** your Gmail login password. `.env` is gitignored — never commit it.

### Switching to PostgreSQL

SQLite is the default and needs no setup. To move to PostgreSQL, set one variable in
`backend/.env` — no code changes:

```
DATABASE_URL=postgres://user:password@localhost:5432/himl
```

Then run `uv run python manage.py migrate`. The `psycopg` driver is already installed.

---

## Architecture

```
backend/
  config/settings.py        env-driven config (DB, email, JWT, CORS, throttling)
  apps/accounts/            User (email login, shipper/transporter role), profiles, OTP
  apps/vehicles/            Vehicle listings + marketplace search filters
  apps/shipments/           ShipmentRequest lifecycle + Trip tracking
  templates/emails/         Bilingual OTP email

frontend/src/
  i18n.js                   all AR/EN strings; sets <html dir> on language change
  api.js                    axios client, JWT attach + refresh-on-401
  auth.jsx                  auth context, role-based home routing
  ui.jsx                    design system — Button/Field/Alert/Card/PageHeader/…
  lib/cn.js                 Tailwind class merging
  pages/                    Landing, Auth, Shipper, Transporter, Profile
```

---

## Core workflow

1. A shipper fills in the cargo form and searches. Filters narrow results by body
   type, size class, payload capacity, city, and availability.
2. The shipper sends a request to a specific vehicle. **The API rejects cargo heavier
   than that vehicle's payload capacity.**
3. The request lands in the transporter's live feed, which polls every 15 seconds
   while the driver is online. They **accept** or **decline**.
4. Accepting creates a **Trip**: `scheduled → in_transit → delivered`.

---

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Create account, sends OTP |
| POST | `/api/auth/otp/verify/` | Activate account, returns JWT |
| POST | `/api/auth/otp/resend/` | New code |
| POST | `/api/auth/login/` | Email **or** phone + password |
| POST | `/api/auth/password/reset/` | Request reset code |
| POST | `/api/auth/password/reset/confirm/` | Set new password |
| GET / PATCH | `/api/auth/me/`, `/api/auth/me/profile/` | Own account & profile |
| POST | `/api/auth/me/online/` | Transporter work-mode toggle |
| GET | `/api/vehicles/search/` | Marketplace listings (shipper) |
| CRUD | `/api/vehicles/mine/` | Own fleet (transporter) |
| POST | `/api/requests/` | Send shipment request |
| GET | `/api/requests/incoming/` | Transporter's live feed |
| POST | `/api/requests/{id}/accept⎪decline⎪cancel/` | Respond |
| GET | `/api/trips/` · POST `/api/trips/{id}/set_status/` | Trip tracking |

---

## Design system compliance

Colour, typography and layout follow **كود المنصات v1.0**.

**Typeface** — IBM Plex Sans Arabic, the system's official font, self-hosted via
`@fontsource` so rendering never depends on an external CDN.

**Colour** — the official SA green, Gold and Gray ramps are declared as design tokens
in `frontend/src/index.css` using the exact hex values from the guide. The palette
derives from the national identity: green from the flag, gold from the embroidery of
the Ardah banner, near-black from the bisht.

| Token | Role | Example |
|---|---|---|
| `sa-700` | Primary actions | `#166A45` |
| `gold-500` | Accent, highlights | `#F5BD02` |
| `gray-950` | Page headers, footer | `#0D121C` |

**Layout** — solid white app bar, white cards on a light gray surface, green primary
buttons, and a near-black footer with a gold rule, matching the page templates in the
guide.

---

## Frontend stack

| Package | Why |
|---|---|
| `class-variance-authority` | Component variants live in one place, so colour and spacing stay consistent |
| `clsx` + `tailwind-merge` | Predictable class merging — later classes reliably win |
| `@tanstack/react-query` | Server-state caching, refetching, and the driver feed's live polling |
| `sonner` | Toast notifications |
| `lucide-react` | Icon set |
| `@fontsource/ibm-plex-sans-arabic` | Self-hosted official typeface |

---

## Accessibility

WCAG 2.1 AA is the conformance target named by the design system.

- **Direction** — `<html dir>` and `lang` follow the active language; layout uses CSS
  logical properties so it mirrors rather than being hand-flipped. The OTP field stays
  LTR in both languages, and city pairs use `<bdi>` with explicit from/to labels so
  mixed Arabic/Latin text never reorders confusingly.
- **Forms** — every input has a real `<label>`; hints and errors are linked via
  `aria-describedby`; invalid fields carry `aria-invalid`; grouped controls use
  `<fieldset>` / `<legend>`.
- **Feedback** — errors announce via `role="alert"`, status via `aria-live="polite"`.
- **Keyboard** — visible 3px focus ring on every interactive element, plus a
  skip-to-content link as the first tab stop.
- **Contrast** — every text/background pair was measured programmatically; zero pairs
  fall below AA.
- **Motion** — animations respect `prefers-reduced-motion`.
- **Responsive** — mobile-first; verified at 375px with no horizontal scroll.

---

## Testing

The end-to-end flow has been exercised with Playwright against a running stack:

- Sign-up → password-policy rejection → valid sign-up → OTP → role-based redirect
- Shipper: cargo form validation, filtering, filter reset, capacity rejection, request sent
- Transporter: online toggle, live feed, accept, trip `scheduled → in_transit`
- Logout returns to the landing page; signed-in users cannot reach it
- Arabic RTL with no untranslated strings; 375px mobile layout

---

## Security

- Passwords hashed by Django (PBKDF2); the policy is enforced server-side, not just in the UI.
- OTPs are **hashed at rest**, single-use, expire in 10 minutes, capped at 5 attempts.
- OTP and login endpoints are rate-limited (`THROTTLE_OTP`, `THROTTLE_LOGIN`).
- Login errors are deliberately generic, and password-reset responses are identical
  whether or not the account exists, so neither endpoint reveals which emails are registered.
- Marketplace listings hide plate numbers and carrier contact details.
- Object-level checks on every accept / decline / cancel — you can only act on your own records.
- Production hardening (HSTS, secure cookies, SSL redirect) activates when `DJANGO_DEBUG=False`.

---

## Roadmap

Highest-value work not yet done:

- `react-hook-form` + `zod` for client-side form validation before submit
- Migrate the shipper and profile pages to React Query (still manual `useState`/`useEffect`)
- Map-based pickup/drop-off selection instead of free-text cities
- Real-time push (WebSocket) for the driver feed in place of polling
- Ratings and payment settlement after delivery

---

## License

Prototype — not yet licensed for production use.
