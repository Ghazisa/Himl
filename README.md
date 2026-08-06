# Himl · حِمْل

A bilingual (Arabic/English) digital freight matching platform connecting **shippers**
(أصحاب البضائع) with **transporters** (أصحاب المركبات).

This is an MVP prototype: Django REST API + React SPA, fully working locally.

---

## Requirements

Both were installed into your home directory during setup — no admin rights needed.

| Tool | Version | Path |
|---|---|---|
| Python | 3.12 (via `uv`) | `~/.local/bin/uv` |
| Node | 22 (via `nvm`) | `~/.nvm` |

If a new terminal cannot find them:

```bash
export PATH="$HOME/.local/bin:$PATH" && source "$HOME/.nvm/nvm.sh"
```

---

## Running the app

Two terminals.

**1 — Backend** (http://127.0.0.1:8000)

```bash
cd backend && uv run python manage.py runserver
```

**2 — Frontend** (http://localhost:5173)

```bash
cd frontend && npm run dev
```

Open <http://localhost:5173>.

### Demo accounts

Seeded by `uv run python manage.py seed_demo`. Password for all: `Himl2026`

| Role | Email |
|---|---|
| Shipper | `shipper@demo.sa` |
| Transporter | `turki@demo.sa` (and `faisal@`, `mohammed@`, `saleh@`, `abdulaziz@`, `nawaf@`) |

Admin panel: <http://127.0.0.1:8000/admin/> — create a login with
`uv run python manage.py createsuperuser`.

---

## Email / OTP configuration

Signup sends a 4-digit code by email. **With no configuration, codes print to the backend
terminal** instead of being sent — the flow is fully testable without secrets.

To send real email via Gmail, create `backend/.env`:

```
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
```

The app password comes from Google Account → Security → 2-Step Verification → App
passwords. It is **not** your Gmail login password. `.env` is gitignored — never commit it.

---

## Switching to PostgreSQL

The app runs on SQLite by default with zero setup. To move to PostgreSQL, set one variable
in `backend/.env` — no code changes:

```
DATABASE_URL=postgres://user:password@localhost:5432/shahen
```

Then `uv run python manage.py migrate`. The `psycopg` driver is already installed.

---

## Architecture

```
backend/
  config/settings.py       env-driven config (DB, email, JWT, CORS, throttling)
  apps/accounts/           User (email login, shipper/transporter role), profiles, OTP
  apps/vehicles/           Vehicle listings + marketplace search filters
  apps/shipments/          ShipmentRequest lifecycle + Trip tracking
frontend/src/
  i18n.js                  all EN/AR strings; sets <html dir> on language change
  api.js                   axios client, JWT attach + refresh-on-401
  auth.jsx                 auth context, role-based home routing
  ui.jsx                   accessible Field / Button / Alert / StatusBadge
  pages/                   Landing, Auth, Shipper, Transporter, Profile
```

### Core workflow

1. Shipper fills the cargo form and searches; filters narrow by body type, size class,
   payload capacity, city, and availability.
2. Shipper sends a request to a specific vehicle. The API rejects cargo heavier than that
   vehicle's payload capacity.
3. The request lands in the transporter's live feed. They **accept** or **decline**.
4. Accepting creates a **Trip** — `scheduled → in_transit → delivered`.

### API reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Create account, sends OTP |
| POST | `/api/auth/otp/verify/` | Activate account, returns JWT |
| POST | `/api/auth/otp/resend/` | New code |
| POST | `/api/auth/login/` | Email **or** phone + password |
| POST | `/api/auth/password/reset/` | Request reset code |
| POST | `/api/auth/password/reset/confirm/` | Set new password |
| GET/PATCH | `/api/auth/me/`, `/api/auth/me/profile/` | Own account & profile |
| POST | `/api/auth/me/online/` | Transporter work-mode toggle |
| GET | `/api/vehicles/search/` | Marketplace listings (shipper) |
| CRUD | `/api/vehicles/mine/` | Own fleet (transporter) |
| POST | `/api/requests/` | Send shipment request |
| GET | `/api/requests/incoming/` | Transporter's live feed |
| POST | `/api/requests/{id}/accept\|decline\|cancel/` | Respond |
| GET | `/api/trips/`, POST `/api/trips/{id}/set_status/` | Trip tracking |

---

## Design system compliance

Built against **كود المنصات — نظام التصميم الموحد للمملكة العربية السعودية v1.0**
(Saudi Digital Government Authority, 17 Nov 2024).

- **Typeface** — IBM Plex Sans Arabic, the system's official font (weights 400/500/600/700).
- **Colour** — the official SA green, Gold and Gray ramps are defined as design tokens in
  `frontend/src/index.css`, with the exact hex values from the guide. SA green is the primary
  brand colour; gold is the accent. The palette derives from the national identity: green from
  the flag, gold from the embroidery of the Ardah banner.
- **Layout** — white header with a green rule, white cards on a gray surface, green primary
  buttons, and a dark green footer, following the page templates in the guide.

Accessibility follows WCAG, which the guide names as its conformance target:

- **Direction** — `<html dir>` and `lang` switch with the language; layout uses CSS logical
  properties so it mirrors rather than being hand-flipped. The OTP field stays LTR in both
  languages, and city pairs use `<bdi>` with explicit from/to labels so mixed Arabic/Latin
  text never reorders confusingly.
- **Forms** — every input has a real `<label>`; hints and errors are linked via
  `aria-describedby`; invalid fields carry `aria-invalid`; grouped controls use
  `<fieldset>/<legend>`.
- **Feedback** — errors announce through `role="alert"`, status through `aria-live="polite"`.
- **Keyboard** — visible 3px focus ring on all interactive elements, plus a skip-to-content
  link as the first tab stop.
- **Motion** — animations respect `prefers-reduced-motion`.
- **Responsive** — mobile-first; single column on phones, multi-column from `sm`/`lg`.

> Partially applied: the landing page uses the system's tokens, typeface and footer, but not
> yet the full gov template structure (hero image band, statistics row, partners section).

## Transporter home screen

Modelled on the Uber driver app, since the matching flow is analogous:

- **Work mode is the centrepiece** — one large circular toggle, one unambiguous state.
- **No contradictory messaging.** An earlier version showed "you are offline, requests will
  not reach you" while simultaneously listing requests to accept. Pending requests are now
  headed "awaiting your response" and explained as previously-sent and still open, while the
  empty state tells an offline driver to go online.
- **Stats row** — completed trips, active trips, rating.
- **Active trip** takes priority above the request feed, with a single next action
  (start trip → mark delivered).

## Security notes

- Passwords hashed by Django (PBKDF2); policy enforced server-side, not just in the UI.
- OTPs are **hashed** at rest, single-use, expire in 10 minutes, capped at 5 attempts.
- OTP and login endpoints are rate-limited (`THROTTLE_OTP`, `THROTTLE_LOGIN` env vars).
- Login errors are deliberately generic, and password-reset responses are identical whether
  or not the account exists, so neither endpoint reveals which emails are registered.
- Marketplace listings hide plate numbers and carrier contact details.
- Object-level checks on every accept/decline/cancel — you can only act on your own records.
- Production hardening (HSTS, secure cookies, SSL redirect) activates when `DJANGO_DEBUG=False`.

### Known advisory

`npm audit` reports an advisory in `react-router` affecting **RSC mode**. This app is a
client-side SPA and does not use RSC, so it is not exposed. Upgrade when a patched 7.x ships.

---

## Not in this MVP

Vehicle-management UI for transporters (the API exists at `/api/vehicles/mine/`; seed data
and the admin panel cover it for now), map-based location picking, in-app messaging,
payments, push notifications, and Arabic translations of server-side validation messages.
