import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FEATURES = ["f1", "f2", "f3"];
const STATS = ["vehicles", "cities", "response"];

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <>
      {/* Dark hero — the black of the bisht and the gold of the Ardah banner,
          both part of the national identity described in كود المنصات. */}
      <section className="relative overflow-hidden bg-gray-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60rem 30rem at 80% -10%, #14573a 0%, transparent 60%), radial-gradient(45rem 25rem at 10% 110%, #472400 0%, transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-600/40 bg-gold-600/10 px-4 py-1.5 text-xs font-semibold text-gold-400">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            {t("app.tagline")}
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
            {t("landing.heroBody")}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-xl bg-gold-500 px-7 py-3.5 text-sm font-bold text-gray-950 transition-colors hover:bg-gold-400"
            >
              {t("landing.ctaPrimary")}
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              {t("landing.ctaSecondary")}
            </Link>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {STATS.map((key) => (
              <div key={key} className="flex flex-col">
                <dd className="text-3xl font-bold text-white">{t(`landing.stat_${key}_value`)}</dd>
                <dt className="mt-1 text-xs text-gray-400">{t(`landing.stat_${key}`)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="features-heading" className="mx-auto max-w-5xl px-4 py-20">
        <h2 id="features-heading" className="text-2xl font-bold text-gray-900">
          {t("landing.featuresTitle")}
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-3">
          {FEATURES.map((key, index) => (
            <li key={key}>
              <article className="h-full rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-base font-bold text-gold-400">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  {t(`landing.${key}Title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {t(`landing.${key}Body`)}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
