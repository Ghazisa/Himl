import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const next = i18n.resolvedLanguage === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      lang={next}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
    >
      <Languages aria-hidden="true" className="h-4 w-4" />
      {t("nav.language")}
    </button>
  );
}
