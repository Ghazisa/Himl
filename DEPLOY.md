<div align="center">

# Deploying Himl · نشر حِمْل

</div>

---

## Architecture

Himl deploys across two free tiers, because Cloudflare's free plan cannot run
Django — Workers execute JavaScript and WASM, and Python Workers are beta
without support for Django or `psycopg`. Running the API on Cloudflare would
require **Cloudflare Containers**, which needs the paid Workers plan.

```
                    ┌──────────────────────────────────────┐
   browser ────────▶│  Cloudflare Pages   (free)           │
                    │  himl.pages.dev                      │
                    │                                      │
                    │  • React SPA (dist/)                 │
                    │  • functions/api/[[path]].js         │
                    └───────────────┬──────────────────────┘
                                    │  /api/*  proxied server-side
                                    ▼
                    ┌──────────────────────────────────────┐
                    │  Render          (free)              │
                    │  himl-api.onrender.com               │
                    │                                      │
                    │  • Django + DRF via gunicorn         │
                    │  • PostgreSQL                        │
                    └──────────────────────────────────────┘
```

The browser only ever talks to the Pages origin. Because `src/lib/api.js` uses a
relative `/api` base URL and the Pages Function forwards the request server-side,
there is **no CORS preflight**, no cross-site cookie problem, and no API hostname
compiled into the JavaScript bundle — the backend can move without a rebuild.

---

## Step 1 — Deploy the API to Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in with
   GitHub. No card is required for the free plan.
2. **New → Blueprint**, then pick the `Ghazisa/Himl` repository. Render reads
   [`render.yaml`](render.yaml) and proposes the web service plus the database.
3. Two variables are deliberately left blank in the blueprint. Leave them empty
   for now — they need the Pages URL, which does not exist yet.
4. **Apply**. The first build takes roughly 3–5 minutes.
5. Copy the service URL, e.g. `https://himl-api.onrender.com`, and confirm it is
   alive:

```bash
curl https://himl-api.onrender.com/healthz
```

It should return `{"status": "ok"}`.

> **Free tier caveats.** The service sleeps after 15 minutes of inactivity, so
> the first request afterwards takes ~30 seconds. Render's free PostgreSQL
> instance expires after 30 days and must be recreated.

---

## Step 2 — Deploy the frontend to Cloudflare Pages

1. Edit [`frontend/wrangler.toml`](frontend/wrangler.toml) and set
   `BACKEND_ORIGIN` to the exact Render URL from step 1, with no trailing slash.
   Commit and push — the proxy reads this value.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to
   Git**, then authorise the `Ghazisa/Himl` repository.
3. Build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | None |
   | Root directory | `frontend` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

4. **Save and Deploy**, then note the assigned URL, e.g. `https://himl.pages.dev`.

---

## Step 3 — Point the API back at Pages

The API refuses requests from unknown hosts, so Render needs to learn the Pages
URL. In the Render dashboard, under **Environment**, set:

| Variable | Value |
|---|---|
| `DJANGO_ALLOWED_HOSTS` | `himl.pages.dev` |
| `CORS_ALLOWED_ORIGINS` | `https://himl.pages.dev` |

Save — Render redeploys automatically. The Render hostname itself is trusted
without configuration; `settings.py` reads it from `RENDER_EXTERNAL_HOSTNAME`.

### Optional: load the demo accounts

Set `SEED_DEMO=true` on Render, trigger one deploy, then set it back to `false`.
This creates the accounts documented in the README, all with the password
`Himl2026`. **Do not leave demo accounts on a deployment that holds real data** —
the password is published in this repository.

---

## Verifying a deployment

```bash
curl https://himl.pages.dev/healthz          # not found — Pages does not proxy this
curl https://himl.pages.dev/api/options/vehicles/   # 200, proxied to Render
curl -I https://himl.pages.dev/login         # 200, SPA shell for a deep link
```

Then log in through the UI and send one request end to end. Per
[CLAUDE.md](CLAUDE.md), check the Arabic (RTL) side too.

---

## Testing the production setup locally

The Pages Function can be run for real, with the actual Cloudflare runtime,
rather than trusting that it will work once deployed:

```bash
cd backend && uv run python manage.py runserver 8000
```

```bash
cd frontend && npm run build && npx wrangler pages dev --port 8788
```

`frontend/.dev.vars` overrides `BACKEND_ORIGIN` to point at the local Django
instance. It is git-ignored; create it with:

```
BACKEND_ORIGIN="http://127.0.0.1:8000"
```

The app then runs at <http://localhost:8788> with the same routing, proxying and
headers as production.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `503 BACKEND_ORIGIN is not configured` | `wrangler.toml` still has the placeholder URL, or Pages did not rebuild after the change. |
| `DisallowedHost` in Render logs | The Pages hostname is missing from `DJANGO_ALLOWED_HOSTS`. |
| Every `/api` call returns 502 | The Render service is asleep or failed to boot — check its logs. |
| First request each morning is slow | Expected on Render's free tier; the service spins down when idle. |
| Deep links 404 | The Pages build output directory is not `dist`, so the SPA shell is missing. |

---

<div align="center" dir="rtl">

## بالعربية

</div>

<div dir="rtl">

**لماذا منصتان؟** خطة Cloudflare المجانية لا تشغّل Django — الـ Workers تعمل
بلغة JavaScript فقط. لذلك تُستضاف الواجهة على **Cloudflare Pages** مجاناً، بينما
تُستضاف واجهة البرمجة وقاعدة البيانات على **Render** مجاناً.

المتصفح يتصل بعنوان واحد فقط هو عنوان Cloudflare، لأن دالة `functions/api` تمرّر
الطلبات إلى Render من جهة الخادم — وبهذا لا حاجة لإعدادات CORS إطلاقاً.

**الخطوات باختصار:**

1. أنشئ Blueprint على Render من ملف `render.yaml`، ثم انسخ رابط الخدمة.
2. ضع الرابط في `BACKEND_ORIGIN` داخل `frontend/wrangler.toml` وارفع التعديل.
3. اربط المستودع بـ Cloudflare Pages، واجعل المجلد الجذر `frontend` ومجلد
   الإخراج `dist`.
4. أضف عنوان Pages إلى `DJANGO_ALLOWED_HOSTS` و `CORS_ALLOWED_ORIGINS` في Render.

**ملاحظات على الخطة المجانية:** خدمة Render تدخل في وضع السكون بعد ١٥ دقيقة من
عدم الاستخدام، فيستغرق أول طلب بعدها ٣٠ ثانية تقريباً. كما أن قاعدة البيانات
المجانية تنتهي صلاحيتها بعد ٣٠ يوماً وتحتاج إعادة إنشاء.

</div>
