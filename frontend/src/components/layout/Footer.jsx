import { useTranslation } from "react-i18next";

/**
 * Shares the near-black surface of the page headers, with a gold rule drawn
 * from the identity palette in كود المنصات v1.0.
 */
export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t-4 border-gold-500 bg-gray-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-center">
        <p className="text-base font-bold text-white">{t("app.name")}</p>
        <p className="text-sm text-gray-300">{t("app.tagline")}</p>
        <p className="mt-3 text-xs text-gray-400">{t("app.compliance")}</p>
      </div>
    </footer>
  );
}
