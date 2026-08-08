<div align="center">

# حِمْل · Himl

**A bilingual freight matching platform connecting shippers with vehicle owners across Saudi Arabia.**

Built to the Saudi Unified Design System — [كود المنصات v1.0](https://www.dga.gov.sa), Digital Government Authority.

[![CI](https://github.com/Ghazisa/Himl/actions/workflows/ci.yml/badge.svg)](https://github.com/Ghazisa/Himl/actions/workflows/ci.yml)

</div>

---

## Overview

Himl connects **shippers** (أصحاب البضائع) who need cargo moved with **transporters**
(أصحاب المركبات) who own vehicles. A shipper describes their cargo, filters the
marketplace for a vehicle that can carry it, and sends a request. The transporter
accepts or declines from a live feed, and accepting turns the request into a trip
that both sides can track to delivery.

The driver experience is modelled on ride-hailing apps: a single prominent
online/offline control, and a request feed that only polls while the driver is online.

> **Status:** working MVP. Runs entirely on a local machine — no cloud services,
> paid accounts, or API keys required.

To publish it instead, see **[DEPLOY.md](DEPLOY.md)** — the frontend goes to a
Cloudflare Worker and the API to Render, both on free tiers.

---

## Quick start

### Prerequisites

Both install into your home directory; no administrator rights needed.

| Tool | Version | Installed at |
|---|---|---|
| Python | 3.12 (via [`uv`](https://docs.astral.sh/uv/)) | `~/.local/bin/uv` |
| Node | 22 (via [`nvm`](https://github.com/nvm-sh/nvm)) | `~/.nvm` |

If a new terminal cannot find them:

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

### Demo accounts

Created by `seed_demo`. Password for every account: `Himl2026`

| Role | Email |
|---|---|
| Shipper | `shipper@demo.sa` |
| Transporter | `turki@demo.sa` — also `faisal@`, `mohammed@`, `saleh@`, `abdulaziz@`, `nawaf@` |

Django admin is at `/admin/`; create a login with `uv run python manage.py createsuperuser`.

---

## Project structure

```
backend/
  config/               settings, URLs, WSGI/ASGI, test settings
  apps/accounts/        User (email login, role), profiles, OTP, auth views
  apps/vehicles/        Vehicle listings, marketplace search filters
  apps/shipments/       ShipmentRequest lifecycle, Trip tracking
  templates/emails/     Bilingual OTP email

frontend/src/
  app/                  App shell, route table, route guards
  components/ui/        Design system — one file per primitive
  components/layout/    Header, Footer, LanguageToggle
  features/
    auth/               Login, Signup, OTP, password reset, auth context
    shipper/            Dashboard, my requests, cargo form, filters, vehicle card
    transporter/        Driver console, my trips, work-mode card, trip card
    profile/            Account and role profile
    landing/            Public landing page
  lib/                  API client, i18n, class merging
```

Each feature owns its pages, sub-components, and API calls, so a change to one
rarely reaches into another. Shared primitives live in `components/ui` and are
imported through a single barrel:

```js
import { Button, Card, Field } from "@/components/ui";
```

The `@/` alias points at `src/`, so imports stay stable no matter how deep a
feature folder nests.

---

## How the matching flow works

1. The shipper fills in cargo details and searches. Filters narrow by body type,
   size class, payload capacity, city, and availability.
2. The shipper sends a request to a specific vehicle. **The API rejects cargo
   heavier than that vehicle's payload capacity** — the check is server-side.
3. The request appears in the transporter's feed, which polls every 15 seconds
   while they are online. They accept or decline.
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
| GET | `/api/vehicles/search/` | Marketplace listings |
| CRUD | `/api/vehicles/mine/` | Own fleet |
| POST | `/api/requests/` | Send shipment request |
| GET | `/api/requests/incoming/` | Transporter's live feed |
| POST | `/api/requests/{id}/accept·decline·cancel/` | Respond to a request |
| GET · POST | `/api/trips/` · `/api/trips/{id}/set_status/` | Trip tracking |

---

## Design system

Colour, typography and layout follow **كود المنصات v1.0**.

**Typeface** — IBM Plex Sans Arabic, the system's official font, self-hosted via
`@fontsource` so rendering never depends on an external CDN.

**Colour** — the official ramps are declared as design tokens in
`frontend/src/index.css` using the exact values from the guide. The palette comes
from the national identity: green from the flag, gold from the embroidery of the
Ardah banner, near-black from the bisht.

| Token | Role | Value |
|---|---|---|
| `sa-700` | Primary actions | `#166A45` |
| `gold-500` | Accent, highlights | `#F5BD02` |
| `gray-950` | Page headers, footer | `#0D121C` |

Every button, badge and alert colour is defined once as a
[`cva`](https://cva.style) variant, so a new colour cannot drift into a page by
accident.

---

## Stack

| Package | Why |
|---|---|
| Django + DRF | Batteries-included API, admin panel, migrations |
| React + Vite | SPA with fast HMR |
| Tailwind CSS | Utility styling with logical properties for RTL |
| `class-variance-authority` | Component variants defined in one place |
| `clsx` + `tailwind-merge` | Predictable class merging |
| `@tanstack/react-query` | Server-state caching, invalidation, driver-feed polling |
| `sonner` | Toast notifications |
| `lucide-react` | Icon set |
| `@fontsource/ibm-plex-sans-arabic` | Self-hosted official typeface |

---

## Accessibility

WCAG 2.1 AA is the target named by the design system.

- **Direction** — `<html dir>` and `lang` follow the active language; layout uses
  CSS logical properties, so it mirrors rather than being hand-flipped.
- **Bidirectional text** — the OTP field stays LTR in both languages, and city
  pairs use `<bdi>` with explicit from/to labels so mixed Arabic/Latin names
  never reorder into a misleading direction.
- **Forms** — every input has a real `<label>`; hints and errors link via
  `aria-describedby`; invalid fields carry `aria-invalid`.
- **Feedback** — errors announce via `role="alert"`, status via `aria-live`.
- **Keyboard** — visible focus ring everywhere, skip-to-content as first tab stop.
- **Contrast** — every text/background pair measured programmatically; zero below AA.
- **Motion** — animations respect `prefers-reduced-motion`.

---

## Testing

```bash
cd backend && uv run python manage.py test --settings=config.settings_test
cd frontend && npm run lint && npm run build
```

27 backend tests cover the password policy, OTP lifecycle, authentication,
capacity validation, and object-level permissions. CI runs both suites plus a
missing-migration check on every push and pull request.

The end-to-end flow has also been exercised with Playwright: sign-up → OTP →
role-based redirect, filtering and filter reset, capacity rejection, request →
accept → trip status advance, sign-out, Arabic RTL, and a 375 px mobile layout.

---

## Configuration

Everything is environment-driven. Copy `backend/.env.example` to `backend/.env`.

**Email / OTP** — with no configuration, codes print to the backend terminal, so
the flow is fully testable without secrets. To send real mail through Gmail:

```
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
```

Generate the app password at Google Account → Security → 2-Step Verification →
App passwords. It is **not** your Gmail login password. `.env` is gitignored.

**Database** — SQLite by default. To use PostgreSQL, set one variable; no code
changes are needed:

```
DATABASE_URL=postgres://user:password@localhost:5432/himl
```

---

## Security

- Passwords hashed with PBKDF2; the policy is enforced server-side, not only in the UI.
- OTPs are hashed at rest, single-use, expire in 10 minutes, capped at 5 attempts.
- OTP and login endpoints are rate-limited.
- Login errors are generic and password-reset responses are identical whether or
  not the account exists, so neither reveals which emails are registered.
- Marketplace listings hide plate numbers and carrier contact details.
- Object-level checks on every accept, decline and cancel.
- HSTS, secure cookies and SSL redirect activate when `DJANGO_DEBUG=False`.

---

## Roadmap

- `react-hook-form` + `zod` for client-side validation before submit
- Map-based pickup and drop-off selection instead of free-text cities
- WebSocket push for the driver feed in place of polling
- Ratings and payment settlement after delivery
- Vehicle management UI for transporters (API already exists)

---

## Licence

All rights reserved — see [LICENSE](LICENSE). Replace it with MIT or Apache-2.0
if you decide to open-source the project.

---
---

<div align="right" dir="rtl">

# حِمْل · Himl

**منصة رقمية ثنائية اللغة لمطابقة الشحن، تربط أصحاب البضائع بأصحاب المركبات في المملكة العربية السعودية.**

مبنية وفق نظام التصميم الموحد — كود المنصات ١.٠، الصادر عن هيئة الحكومة الرقمية.

---

## نظرة عامة

يربط **حِمْل** أصحاب البضائع الذين يحتاجون نقل شحناتهم بأصحاب المركبات. يصف صاحب
البضاعة شحنته، ويصفّي السوق بحثاً عن مركبة قادرة على نقلها، ثم يرسل طلباً. يقبل
الناقل الطلب أو يرفضه من قائمة مباشرة، وعند القبول يتحول الطلب إلى رحلة يتابعها
الطرفان حتى التسليم.

صُمّمت واجهة الناقل على غرار تطبيقات النقل الذكي: زر واحد بارز للاتصال والانفصال،
وقائمة طلبات لا تتحدث تلقائياً إلا أثناء اتصال الناقل.

> **الحالة:** نموذج أولي عامل. يعمل بالكامل على جهاز محلي — دون خدمات سحابية أو
> حسابات مدفوعة أو مفاتيح API.

---

## التشغيل السريع

### المتطلبات

كلاهما يُثبَّت في مجلد المستخدم دون صلاحيات إدارية.

| الأداة | الإصدار | مكان التثبيت |
|---|---|---|
| Python | ٣.١٢ (عبر `uv`) | `~/.local/bin/uv` |
| Node | ٢٢ (عبر `nvm`) | `~/.nvm` |

### التشغيل

نافذتان طرفيتان — الخادم الخلفي على المنفذ ٨٠٠٠، والواجهة على ٥١٧٣. الأوامر
مذكورة في القسم الإنجليزي أعلاه.

### حسابات تجريبية

كلمة المرور لجميع الحسابات: `Himl2026`

| الدور | البريد |
|---|---|
| صاحب بضاعة | `shipper@demo.sa` |
| صاحب مركبة | `turki@demo.sa` وغيره |

---

## بنية المشروع

الواجهة مقسّمة حسب **الميزات** لا حسب نوع الملف، وهو ما يجعل التعديل والتوسّع أسهل
مع نمو المشروع:

- `app/` — هيكل التطبيق، جدول المسارات، وحُرّاس الصلاحيات
- `components/ui/` — نظام التصميم، ملف لكل عنصر
- `components/layout/` — الترويسة والتذييل ومبدّل اللغة
- `features/` — كل ميزة تملك صفحاتها ومكوّناتها ونداءات الـAPI الخاصة بها
- `lib/` — عميل الـAPI، الترجمة، ودمج الأصناف

في الخلفية، كل تطبيق Django مستقل: `accounts` للحسابات، `vehicles` للمركبات،
`shipments` للطلبات والرحلات.

---

## سير العمل

١. يُدخل صاحب البضاعة تفاصيل شحنته ويبحث، مع إمكانية التصفية حسب نوع المركبة
وحجمها وحمولتها والمدينة والتوفّر.

٢. يرسل طلباً لمركبة محددة. **يرفض الخادم أي شحنة تتجاوز حمولة المركبة** — والتحقق
يتم في الخلفية لا في المتصفح فقط.

٣. يظهر الطلب في قائمة الناقل، التي تتحدث كل ١٥ ثانية أثناء اتصاله، فيقبل أو يرفض.

٤. عند القبول تُنشأ **رحلة**: مجدولة ← قيد النقل ← تم التسليم.

---

## نظام التصميم

الألوان والخطوط والتخطيط تتبع **كود المنصات ١.٠**:

- **الخط:** IBM Plex Sans Arabic، الخط الرسمي، مستضاف محلياً داخل المشروع فلا
  يعتمد على أي مصدر خارجي.
- **الألوان:** مستوحاة من الهوية الوطنية — الأخضر من العلم، والذهبي من تطريز بيرق
  العرضة، والأسود من البشت.
- كل لون معرَّف مرة واحدة فقط، فلا يمكن أن يتسرّب لون مخالف إلى صفحة بالخطأ.

---

## إمكانية الوصول

المعيار المستهدف هو WCAG 2.1 AA:

- اتجاه الصفحة ولغتها يتغيّران مع اللغة، والتخطيط ينعكس تلقائياً
- رمز التحقق يبقى من اليسار لليمين في اللغتين
- أسماء المدن معزولة بـ`<bdi>` مع تسميات صريحة، فلا تنقلب في العربية
- لكل حقل تسمية حقيقية، والأخطاء مرتبطة به برمجياً
- مؤشر تركيز واضح، ورابط تخطٍّ للمحتوى كأول عنصر
- جميع تباينات الألوان مقيسة برمجياً، ولا يوجد أي تباين دون الحد المطلوب

---

## الاختبارات

٢٧ اختباراً في الخلفية تغطي سياسة كلمة المرور، ودورة حياة رمز التحقق، والمصادقة،
والتحقق من الحمولة، وصلاحيات الوصول. تعمل جميعها تلقائياً عبر GitHub Actions مع كل
تعديل، إضافة إلى فحص الترحيلات الناقصة وبناء الواجهة.

كما اختُبر التدفق الكامل عبر Playwright: التسجيل، رمز التحقق، التوجيه حسب الدور،
التصفية وإعادة الضبط، رفض الحمولة الزائدة، الطلب والقبول وتقدّم الرحلة، تسجيل
الخروج، والعرض العربي، وتخطيط الجوال.

---

## الأمان

- كلمات المرور مشفّرة، والسياسة مطبَّقة في الخادم لا في الواجهة فقط
- رموز التحقق مشفّرة ولا تُستخدم إلا مرة واحدة، وتنتهي خلال ١٠ دقائق
- تحديد معدل الطلبات على نقاط الدخول والتحقق
- رسائل الخطأ عامة، فلا تكشف أي بريد مسجّل في النظام
- أرقام اللوحات وبيانات التواصل مخفية عن قوائم السوق
- تحقق من الملكية عند كل قبول أو رفض أو إلغاء

---

## الترخيص

جميع الحقوق محفوظة — انظر ملف [LICENSE](LICENSE).

</div>
