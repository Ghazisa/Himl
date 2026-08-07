# Working agreements for Himl

## Always verify new features with Playwright

After building any new feature, **drive it in a real browser with Playwright before
reporting it as done.** A passing build and a green unit-test run are not enough — they
have both passed here while the app was actually broken in the browser.

Do not ask the user to check manually. Verify it, then say what was verified.

### Procedure

1. Start both servers (backend on `:8000`, frontend on `:5173`).
2. Navigate to the affected screen with `browser_navigate`.
3. Exercise the feature the way a user would — click, type, submit — not just page loads.
4. Assert the outcome changed: read the DOM/state, don't trust the screenshot alone.
5. Check `browser_console_messages` for errors, and confirm any error you find is
   expected rather than a defect.
6. Re-check in **Arabic (RTL)** as well as English, since the app is bilingual.

### What to cover for a feature touching the core flow

Shipper → cargo form → search and filters → send request → transporter feed → accept →
trip status advances. Also confirm logged-out users cannot reach protected routes.

### Known traps

- **`main.jsx` imports break silently on refactors.** Moving files under `src/` has
  already broken the production build twice. Run `npm run build`, not just `npm run dev`.
- **The dev server must be restarted** after moving or renaming modules; HMR reports
  stale success.
- **Reading a button's label inside a `setTimeout` after clicking it** returns the label
  *after* React re-rendered. Capture state before the click.
- **Seed data drifts from the docs.** If credentials are involved, verify the password in
  the README actually logs in.

## Commands

```bash
# Backend tests (27) — never run the default settings, throttling breaks them
cd backend && uv run python manage.py test --settings=config.settings_test

# Frontend must build, not just run
cd frontend && npm run build

# Refresh demo data (idempotent; resets passwords to Himl2026)
cd backend && uv run python manage.py seed_demo
```

## Project conventions

- **Design system**: colours, spacing and variants live in `frontend/src/components/ui`
  as `cva` definitions. Never hardcode a colour in a page — add or reuse a variant.
- **Palette is fixed** by كود المنصات v1.0 (SA green, Gold, Gray). Do not introduce
  colours outside those ramps.
- **Frontend is organised by feature**, not file type. Shared code goes in
  `components/ui` or `lib`, imported via the `@/` alias.
- **Bilingual**: every user-facing string goes through `lib/i18n.js` in both AR and EN.
  Use CSS logical properties (`ms-`/`me-`) so RTL mirrors automatically.
- **Accessibility target is WCAG 2.1 AA.** Every text/background pair must clear 4.5:1
  (3:1 for large text), every page needs one `<h1>`, and every control needs a label.
- **Never commit** `.env`, `db.sqlite3`, `node_modules`, `.venv`, or build output.
