# حِمْل · Himl

A bilingual (Arabic / English) digital freight matching platform connecting **shippers**
(أصحاب البضائع) with **transporters** (أصحاب المركبات) across Saudi Arabia.

Built to the **Saudi Unified Design System** — كود المنصات v1.0, published by the Digital
Government Authority on 17 November 2024.

**[العربية بالأسفل ↓](#حِمْل--منصة-مطابقة-الشحن-الرقمية)**

---

## Contents

- [Status](#status)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Email and OTP](#email-and-otp)
- [Project layout](#project-layout)
- [Core workflow](#core-workflow)
- [API reference](#api-reference)
- [Design system](#design-system)
- [Frontend stack](#frontend-stack)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)

---

## Status

Working MVP. Django REST API + React SPA, runs entirely on a local machine — no cloud
services or paid accounts required.

| | |
|---|---|
| Backend tests | 27, all passing |
| CI | GitHub Actions — backend tests, migration check, frontend lint and build |
| Contrast | Every text/background pair measured; zero below WCAG AA |

---

## Quick start

### Prerequisites

Both install into your home directory — no administrator rights needed.

| Tool | Version | Location |
|---|---|---|
| Python | 3.12 | [`uv`](https://docs.astral.sh/uv/) at `~/.local/bin/uv` |
| Node | 22 | [`nvm`](https://github.com/nvm-sh/nvm) at `~/.nvm` |

If a fresh terminal cannot find them:

```bash
export PATH="$HOME/.local/bin:$PATH" && source "$HOME/.nvm/nvm.sh"
```

### Run

Two terminals.

**Backend** → http://127.0.0.1:8000

```bash
cd backend && uv run python manage.py migrate && uv run python manage.py seed_demo && uv run python manage.py runserver
```

**Frontend** → http://localhost:5173

```bash
cd frontend && npm install && npm run dev
```

### Test

```bash
cd backend && uv run python manage.py test --settings=config.settings_test
```

---

## Demo accounts

Created by `uv run python manage.py seed_demo`. Password for every account: `Himl2026`

| Role | Email |
|---|---|
| Shipper | `shipper@demo.sa` |
| Transporter | `turki@demo.sa` — also `faisal@`, `mohammed@`, `saleh@`, `abdulaziz@`, `nawaf@` |

Django admin: <http://127.0.0.1:8000/admin/> — create a login with
`uv run python manage.py createsuperuser`.

---

## Email and OTP

Sign-up sends a 4-digit code by email. **With no configuration the code is printed to the
backend terminal** instead of being sent, so the whole flow is testable without secrets.

To send real mail through Gmail, create `backend/.env`:

```
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
```

Generate the app password at Google Account → Security → 2-Step Verification → App
passwords. It is **not** your Gmail login password. `.env` is gitignored — never commit it.

### PostgreSQL

SQLite is the default and needs no setup. To move to PostgreSQL, set one variable in
`backend/.env` — no code changes:

```
DATABASE_URL=postgres://user:password@localhost:5432/himl
```

Then run `uv run python manage.py migrate`. The `psycopg` driver is already installed.

---

## Project layout

```
.github/workflows/ci.yml    Backend tests, migration check, frontend lint + build

backend/
  config/settings.py        Env-driven config (DB, email, JWT, CORS, throttling)
  config/settings_test.py   Test overrides: no throttling, fast hasher, in-memory DB
  apps/accounts/            User (email login, shipper/transporter role), profiles, OTP
  apps/vehicles/            Vehicle listings + marketplace search filters
  apps/shipments/           ShipmentRequest lifecycle + Trip tracking
  templates/emails/         Bilingual OTP email

frontend/src/
  app/App.jsx               Routing, header, footer, route guards
  components/ui/            Design system — Button, Field, Alert, Card, PageHeader…
  features/auth/            AuthContext + login, signup, OTP, password reset
  features/landing/         Public landing page
  features/shipper/         Cargo form, vehicle search and filters, my requests
  features/transporter/     Work mode, incoming requests, trips
  features/profile/         Profile page
  lib/api.js                Axios client, JWT attach + refresh-on-401
  lib/i18n.js               All AR/EN strings; sets <html dir> on language change
  lib/cn.js                 Tailwind class merging
```

**Backend** — each Django app owns its models, serializers, views and tests, so a new
domain (payments, ratings) is added as a new app rather than by growing an existing one.

**Frontend** — organised by feature, not by file type. A feature folder holds its own
pages, components and API calls, so everything you need to change one part of the product
sits together. Anything shared lives in `components/ui` or `lib`, imported through the
`@/` alias so a path never breaks when a file moves deeper.

---

## Core workflow

1. A shipper fills in the cargo form and searches. Filters narrow results by body type,
   size class, payload capacity, city and availability.
2. The shipper sends a request to a specific vehicle. **The API rejects cargo heavier than
   that vehicle's payload capacity.**
3. The request lands in the transporter's feed, which polls every 15 seconds while the
   driver is online. They **accept** or **decline**.
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
| GET / PATCH | `/api/auth/me/`, `/api/auth/me/profile/` | Own account and profile |
| POST | `/api/auth/me/online/` | Transporter work-mode toggle |
| GET | `/api/vehicles/search/` | Marketplace listings (shipper) |
| CRUD | `/api/vehicles/mine/` | Own fleet (transporter) |
| POST | `/api/requests/` | Send shipment request |
| GET | `/api/requests/incoming/` | Transporter feed |
| POST | `/api/requests/{id}/accept⎪decline⎪cancel/` | Respond |
| GET | `/api/trips/` · POST `/api/trips/{id}/set_status/` | Trip tracking |

Logging in with an unverified account returns **403** with `verification_required: true`
in the body; the client keys off that flag rather than the status code.

---

## Design system

Colour, typography and layout follow **كود المنصات v1.0**.

**Typeface** — IBM Plex Sans Arabic, the system's official font, self-hosted via
`@fontsource` so rendering never depends on an external CDN.

**Colour** — the official SA green, Gold and Gray ramps are declared as design tokens in
`frontend/src/index.css` using the exact hex values from the guide. The palette derives
from the national identity: green from the flag, gold from the embroidery of the Ardah
banner, near-black from the bisht.

| Token | Role | Hex |
|---|---|---|
| `sa-700` | Primary actions | `#166A45` |
| `gold-500` | Accent, highlights | `#F5BD02` |
| `gray-950` | Page headers, footer | `#0D121C` |

Component variants live in `ui.jsx` as `cva` definitions, so a colour is defined once and
every screen inherits it.

---

## Frontend stack

| Package | Why |
|---|---|
| `class-variance-authority` | Component variants in one place — keeps colour and spacing consistent |
| `clsx` + `tailwind-merge` | Predictable class merging; later classes reliably win |
| `@tanstack/react-query` | Server-state caching, refetching, and the driver feed's live polling |
| `sonner` | Toast notifications |
| `lucide-react` | Icon set |
| `@fontsource/ibm-plex-sans-arabic` | Self-hosted official typeface |

---

## Accessibility

WCAG 2.1 AA is the conformance target named by the design system.

- **Direction** — `<html dir>` and `lang` follow the active language; layout uses CSS
  logical properties so it mirrors rather than being hand-flipped. The OTP field stays LTR
  in both languages, and city pairs use `<bdi>` with explicit from/to labels so mixed
  Arabic/Latin text never reorders confusingly.
- **Forms** — every input has a real `<label>`; hints and errors link via
  `aria-describedby`; invalid fields carry `aria-invalid`; grouped controls use
  `<fieldset>` / `<legend>`.
- **Feedback** — errors announce via `role="alert"`, status via `aria-live="polite"`.
- **Keyboard** — visible 3px focus ring on every interactive element, plus a
  skip-to-content link as the first tab stop.
- **Contrast** — every text/background pair measured programmatically; zero below AA.
- **Motion** — animations respect `prefers-reduced-motion`.
- **Responsive** — mobile-first; verified at 375px with no horizontal scroll.

---

## Testing

**Backend — 27 automated tests** (`apps/accounts/tests.py`, `apps/shipments/tests.py`):

- Password policy enforced server-side, not just in the UI
- OTP hashed at rest, wrong codes rejected, unverified login refused
- Login by email or phone; identical errors for unknown account and wrong password
- Profile read/patch and work-mode toggle (guards a real past regression)
- Capacity guard: cargo heavier than the vehicle is rejected
- Object-level ownership: another driver cannot accept someone else's request

**Frontend** — the end-to-end flow has been exercised with Playwright: sign-up → OTP →
role redirect, cargo validation, filtering and filter reset, capacity rejection, request
sent, accept, trip progression, logout, Arabic RTL, and a 375px mobile layout.

---

## Security

- Passwords hashed by Django (PBKDF2); the policy is enforced server-side.
- OTPs are **hashed at rest**, single-use, expire in 10 minutes, capped at 5 attempts.
- OTP and login endpoints are rate-limited (`THROTTLE_OTP`, `THROTTLE_LOGIN`).
- Login errors are deliberately generic, and password-reset responses are identical
  whether or not the account exists, so neither reveals which emails are registered.
- Marketplace listings hide plate numbers and carrier contact details.
- Object-level checks on every accept / decline / cancel.
- Production hardening (HSTS, secure cookies, SSL redirect) activates when
  `DJANGO_DEBUG=False`.

> Set `DJANGO_SECRET_KEY` in the environment before deploying. The bundled default is a
> development placeholder.

---

## Roadmap

- `react-hook-form` + `zod` for client-side validation before submit
- Migrate the shipper and profile pages to React Query (still manual `useState`/`useEffect`)
- Map-based pickup and drop-off selection instead of free-text cities
- WebSocket push for the driver feed in place of polling
- Ratings and payment settlement after delivery

---

## License

Prototype — not yet licensed for production use.

---
---

<div dir="rtl" lang="ar">

# حِمْل · منصة مطابقة الشحن الرقمية

منصة رقمية ثنائية اللغة (عربي / إنجليزي) تربط **أصحاب البضائع** بـ**أصحاب المركبات** في
المملكة العربية السعودية.

مبنية وفق **نظام التصميم الموحد للمملكة العربية السعودية** — كود المنصات الإصدار ١٫٠،
الصادر عن هيئة الحكومة الرقمية في ١٧ نوفمبر ٢٠٢٤.

## الحالة

نموذج أولي عامل. واجهة برمجية بـ Django REST مع تطبيق React، يعمل بالكامل على جهازك
المحلي دون أي خدمات سحابية أو حسابات مدفوعة.

| | |
|---|---|
| اختبارات الواجهة الخلفية | ٢٧ اختباراً، جميعها ناجحة |
| التكامل المستمر | GitHub Actions — الاختبارات، فحص الترحيلات، بناء الواجهة |
| تباين الألوان | كل تركيبة لونية مقاسة؛ صفر مخالفة لمعيار WCAG AA |

## التشغيل السريع

### المتطلبات

كلاهما يُثبَّت في مجلدك الشخصي — دون صلاحيات إدارية.

| الأداة | الإصدار | المسار |
|---|---|---|
| Python | ٣٫١٢ | `uv` في `~/.local/bin/uv` |
| Node | ٢٢ | `nvm` في `~/.nvm` |

إذا لم تجدهما الطرفية الجديدة:

```bash
export PATH="$HOME/.local/bin:$PATH" && source "$HOME/.nvm/nvm.sh"
```

### التشغيل

طرفيتان.

**الواجهة الخلفية** ← http://127.0.0.1:8000

```bash
cd backend && uv run python manage.py migrate && uv run python manage.py seed_demo && uv run python manage.py runserver
```

**الواجهة الأمامية** ← http://localhost:5173

```bash
cd frontend && npm install && npm run dev
```

### الاختبارات

```bash
cd backend && uv run python manage.py test --settings=config.settings_test
```

## الحسابات التجريبية

يُنشئها الأمر `seed_demo`. كلمة المرور لجميع الحسابات: `Himl2026`

| الدور | البريد الإلكتروني |
|---|---|
| صاحب بضاعة | `shipper@demo.sa` |
| صاحب مركبة | `turki@demo.sa` — وكذلك `faisal@` و`mohammed@` و`saleh@` و`abdulaziz@` و`nawaf@` |

## البريد ورمز التحقق

يرسل التسجيل رمزاً من ٤ أرقام بالبريد. **بدون أي إعداد يُطبع الرمز في طرفية الخادم**
بدل إرساله، فيمكن اختبار المسار كاملاً دون أسرار.

لإرسال بريد حقيقي عبر Gmail، أنشئ ملف `backend/.env`:

```
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=كلمة-مرور-التطبيق-المكونة-من-١٦-حرفاً
```

كلمة مرور التطبيق تُنشأ من: حساب Google ← الأمان ← التحقق بخطوتين ← كلمات مرور
التطبيقات. وهي **ليست** كلمة مرور بريدك. الملف `.env` مستثنى من Git — لا ترفعه أبداً.

## بنية المشروع

كل تطبيق في Django يملك نماذجه ومسلسلاته وعروضه واختباراته، فإضافة مجال جديد (المدفوعات،
التقييمات) تكون بإنشاء تطبيق جديد بدل تضخيم تطبيق قائم.

## سير العمل الأساسي

١. يعبّئ صاحب البضاعة نموذج الشحنة ويبحث، ثم يصفّي النتائج حسب نوع المركبة وحجمها
وحمولتها والمدينة والتوفر.

٢. يرسل طلباً لمركبة محددة. **ترفض الواجهة البرمجية أي بضاعة أثقل من حمولة المركبة.**

٣. يصل الطلب إلى قائمة الناقل، التي تُحدَّث كل ١٥ ثانية أثناء اتصاله. فيقبل أو يرفض.

٤. القبول يُنشئ **رحلة**: `مجدولة ← قيد النقل ← تم التسليم`.

## نظام التصميم

**الخط** — IBM Plex Sans Arabic، الخط الرسمي للنظام، مستضاف محلياً حتى لا يعتمد العرض
على أي مصدر خارجي.

**الألوان** — تدرجات SA الخضراء والذهبية والرمادية الرسمية معرّفة كرموز تصميم بقيم مطابقة
للدليل. اللوحة مستمدة من الهوية الوطنية: الأخضر من العلم، والذهبي من تطريز بيرق العرضة،
والأسود من البشت.

| الرمز | الاستخدام | القيمة |
|---|---|---|
| `sa-700` | الأزرار والإجراءات | `#166A45` |
| `gold-500` | التمييز واللمسات | `#F5BD02` |
| `gray-950` | ترويسات الصفحات والتذييل | `#0D121C` |

## إمكانية الوصول

معيار WCAG 2.1 AA هو المستهدف كما ينص عليه الدليل.

- **الاتجاه** — `dir` و`lang` يتبعان اللغة النشطة، والتخطيط يستخدم الخصائص المنطقية في
  CSS فينعكس تلقائياً. حقل رمز التحقق يبقى من اليسار لليمين في اللغتين، وأزواج المدن
  تستخدم `<bdi>` مع تسميتَي "من" و"إلى" حتى لا ينقلب ترتيب النص المختلط.
- **النماذج** — لكل حقل تسمية حقيقية، والتلميحات والأخطاء مرتبطة بـ`aria-describedby`.
- **التنبيهات** — الأخطاء تُعلَن عبر `role="alert"` والحالة عبر `aria-live`.
- **لوحة المفاتيح** — إطار تركيز واضح بسماكة ٣ بكسل، ورابط "تخطَّ إلى المحتوى" كأول عنصر.
- **الحركة** — تحترم إعداد `prefers-reduced-motion`.
- **الاستجابة** — مصممة للجوال أولاً، ومختبرة عند عرض ٣٧٥ بكسل دون تمرير أفقي.

## الأمان

- كلمات المرور مشفّرة بـ PBKDF2، والسياسة مفروضة من الخادم لا من الواجهة فقط.
- رموز التحقق **مشفّرة عند التخزين**، تُستخدم مرة واحدة، تنتهي خلال ١٠ دقائق، وبحد أقصى
  ٥ محاولات.
- حدود معدل على نقاط التحقق وتسجيل الدخول.
- رسائل الخطأ موحّدة عمداً، فلا تكشف ما إذا كان البريد مسجّلاً.
- قوائم السوق تخفي أرقام اللوحات وبيانات التواصل.
- تحقق من الملكية على مستوى السجل في كل قبول أو رفض أو إلغاء.

> اضبط `DJANGO_SECRET_KEY` في البيئة قبل أي نشر. القيمة المضمّنة للتطوير فقط.

## خارطة الطريق

- `react-hook-form` و`zod` للتحقق من النماذج قبل الإرسال
- نقل صفحتَي صاحب البضاعة والملف الشخصي إلى React Query
- اختيار مواقع التحميل والتسليم من خريطة بدل النص الحر
- دفع لحظي عبر WebSocket بدل الاستطلاع الدوري
- التقييمات وتسوية المدفوعات بعد التسليم

## الترخيص

نموذج أولي — غير مرخّص للاستخدام الإنتاجي بعد.

</div>
