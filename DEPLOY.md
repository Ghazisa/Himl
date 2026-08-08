<div align="center">

# Deploying Himl · نشر حِمْل

</div>

---

## Architecture

Himl deploys across two free tiers, because Cloudflare's free plan cannot run Django —
Workers execute JavaScript and WASM, and Python Workers are beta without support for
Django or `psycopg`. Running the API on Cloudflare would require **Cloudflare
Containers**, which needs the paid Workers plan.

```
                    ┌──────────────────────────────────────┐
   browser ────────▶│  Cloudflare Worker   (free)          │
                    │                                      │
                    │  • static assets (dist/) via ASSETS  │
                    │  • worker/index.js proxies /api/*    │
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

The browser only ever talks to the Cloudflare origin. Because `src/lib/api.js` uses a
relative `/api` base URL and the Worker forwards the request server-side, there is **no
CORS preflight**, no cross-site cookie problem, and no API hostname compiled into the
JavaScript bundle — the backend can move without a rebuild.

> **Worker, not Pages.** Cloudflare's dashboard now creates Workers by default, and
> Workers is where new features land. The Pages-only conventions — a `functions/`
> directory, `pages_build_output_dir`, `wrangler pages dev` — do not apply here.

---

## Step 1 — Deploy the API to Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
   No card is required for the free plan.
2. **New → Blueprint**, then pick the `Ghazisa/Himl` repository. Render reads
   [`render.yaml`](render.yaml) and proposes the web service plus the database.
3. Set **Branch** to `main` and leave the Blueprint path empty.
4. Four variables are deliberately blank in the blueprint. Leave all four empty —
   `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` need the Cloudflare URL, which does
   not exist yet, and the two `EMAIL_*` values are optional.
5. **Apply**. The first build takes roughly 3–5 minutes.
6. Copy the service URL and confirm it is alive:

```bash
curl https://himl-api.onrender.com/healthz
```

It should return `{"status": "ok"}`.

> **Free tier caveats.** The service sleeps after 15 minutes of inactivity, so the first
> request afterwards takes ~30 seconds. Render's free PostgreSQL expires after 30 days
> and must be recreated.

### Loading the demo accounts

The database starts empty, so there is nothing to log in with. Set `SEED_DEMO=true` under
**Environment**, let the redeploy finish, then **set it back to `false`**. Leaving it on
re-seeds and resets passwords on every future deploy.

This creates the accounts in the README, all with the password `Himl2026`. **Never leave
demo accounts on a deployment holding real data** — that password is published here.

---

## Step 2 — Deploy the frontend to Cloudflare

1. Set `BACKEND_ORIGIN` in [`frontend/wrangler.toml`](frontend/wrangler.toml) to the
   Render URL from step 1, with no trailing slash. Commit and push.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Connect to Git**, then
   authorise the `Ghazisa/Himl` repository.
3. Under **Settings → Build → Build configuration**:

   | Setting | Value |
   |---|---|
   | **Root directory** | **`frontend`** |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Production branch | `main` |

   Everything else — the assets directory, SPA fallback, routing and variables — is read
   from `wrangler.toml`, so it does not need setting in the dashboard.

4. Deploy, then note the assigned `*.workers.dev` URL.

> **Root directory is the one that bites.** The repository root has no `package.json`, so
> leaving it at `/` fails the build immediately.

---

## Step 3 — Nothing, and here is why

There is no third step. `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` can stay empty,
which is worth understanding rather than taking on trust.

The Worker proxies server-side, so the request Django actually receives carries
`Host: himl-api.onrender.com` — never the Cloudflare hostname. That host is already
trusted, because `settings.py` reads it from `RENDER_EXTERNAL_HOSTNAME`. And since the
browser only ever calls a same-origin `/api` path, no cross-origin request is made at
all, so CORS never enters the picture.

Set these two only if you later point a custom domain **directly** at Render, bypassing
the Worker.

---

## Verifying a deployment

```bash
curl -I https://himl.gazi1zh.workers.dev/login                  # 200, SPA shell for a deep link
curl https://himl.gazi1zh.workers.dev/api/options/vehicles/     # 200, proxied to Render
```

The second must return readable JSON with **no** `Content-Encoding` header — a plain
`curl` does not advertise brotli, and receiving a compressed body means the Worker is
forwarding `Accept-Encoding` again.

Then log in through the UI and send one request end to end. Per [CLAUDE.md](CLAUDE.md),
check the Arabic (RTL) side too.

---

## Testing the production setup locally

`wrangler dev` runs the real Cloudflare runtime, so the Worker can be exercised for real
rather than trusted to work once deployed:

```bash
cd frontend && npm run build && npx wrangler dev --port 8788
```

By default this proxies to the **deployed** Render API from `wrangler.toml`, which is
usually what you want — it covers the actual production path. To point at local Django
instead, create `frontend/.dev.vars` (git-ignored):

```
BACKEND_ORIGIN="http://127.0.0.1:8000"
```

and run the backend with `cd backend && uv run python manage.py runserver 8000`.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Build fails immediately, `package.json` not found | Root directory is not `frontend`. |
| `503 BACKEND_ORIGIN is not configured` | `wrangler.toml` has no `BACKEND_ORIGIN`, or the Worker was not redeployed after the change. |
| API calls return HTML instead of JSON | `run_worker_first = ["/api/*"]` is missing, so the SPA fallback answered first. |
| Garbled bytes from `curl` without `--compressed` | The Worker is forwarding `Accept-Encoding`; it must be deleted before the origin fetch. |
| `DisallowedHost` in Render logs | The Worker hostname is missing from `DJANGO_ALLOWED_HOSTS`. |
| Every `/api` call returns 502 | The Render service is asleep or failed to boot — check its logs. |
| First request each morning is slow | Expected on Render's free tier; the service spins down when idle. |
| Demo passwords keep resetting | `SEED_DEMO` is still `true` on Render. |

---

<div align="center" dir="rtl">

## بالعربية

</div>

<div dir="rtl">

**لماذا منصتان؟** خطة Cloudflare المجانية لا تشغّل Django — الـ Workers تعمل بلغة
JavaScript فقط. لذلك تُستضاف الواجهة على **Cloudflare Worker** مجاناً، بينما تُستضاف
واجهة البرمجة وقاعدة البيانات على **Render** مجاناً.

المتصفح يتصل بعنوان واحد فقط هو عنوان Cloudflare، لأن الملف `worker/index.js` يمرّر
الطلبات إلى Render من جهة الخادم — وبهذا لا حاجة لإعدادات CORS إطلاقاً.

**ملاحظة مهمة:** هذا المشروع **Worker وليس Pages**. واجهة Cloudflare صارت تنشئ Workers
افتراضياً، وإعدادات Pages (مجلد `functions/` و `pages_build_output_dir`) لا تعمل هنا.

**الخطوات باختصار:**

1. أنشئ Blueprint على Render من ملف `render.yaml`، ثم انسخ رابط الخدمة.
2. ضع الرابط في `BACKEND_ORIGIN` داخل `frontend/wrangler.toml` وارفع التعديل.
3. اربط المستودع بـ Cloudflare، واجعل **المجلد الجذر `frontend`** وأمر البناء
   `npm run build` وأمر النشر `npx wrangler deploy`.
4. أضف عنوان Worker إلى `DJANGO_ALLOWED_HOSTS` و `CORS_ALLOWED_ORIGINS` في Render.

**لتحميل الحسابات التجريبية:** اجعل `SEED_DEMO=true` في Render لنشرة واحدة فقط، ثم
أعده إلى `false` — وإلا أعاد تصفير كلمات المرور مع كل نشر.

**ملاحظات على الخطة المجانية:** خدمة Render تدخل في وضع السكون بعد ١٥ دقيقة من عدم
الاستخدام، فيستغرق أول طلب بعدها ٣٠ ثانية تقريباً. كما أن قاعدة البيانات المجانية تنتهي
صلاحيتها بعد ٣٠ يوماً وتحتاج إعادة إنشاء.

</div>
