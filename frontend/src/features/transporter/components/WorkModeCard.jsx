import { useTranslation } from "react-i18next";

/**
 * The centrepiece of the driver screen: one control, one unambiguous state.
 * Going offline must never sit alongside actionable requests.
 */
export function WorkModeCard({ name, isOnline, onToggle, busy }) {
  const { t } = useTranslation();

  return (
    <section
      className={`rounded-2xl p-6 text-center transition-colors ${
        isOnline ? "bg-sa-800 text-white" : "bg-gray-900 text-white"
      }`}
    >
      <p className="text-sm text-gray-200">{t("transporter.greeting", { name })}</p>

      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-pressed={isOnline}
        className={`mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full text-lg font-bold transition-transform disabled:opacity-60 ${
          isOnline ? "bg-sa-300 text-sa-950 pulse-online" : "bg-white text-gray-900 hover:scale-105"
        }`}
      >
        {isOnline ? t("transporter.goOffline") : t("transporter.goOnline")}
      </button>

      <p
        className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-sa-300" : "bg-gray-400"}`}
        />
        {isOnline ? t("transporter.statusOnline") : t("transporter.statusOffline")}
      </p>
      <p className="mt-1 text-xs text-gray-200">
        {isOnline ? t("transporter.tapToStop") : t("transporter.tapToGo")}
      </p>
    </section>
  );
}
