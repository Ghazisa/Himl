import { useTranslation } from "react-i18next";

/** Shared dark backdrop + floating card used by every authentication screen. */
export function AuthShell({ title, subtitle, children }) {
  const { t } = useTranslation();
  return (
    <div className="relative isolate min-h-[80vh] bg-gray-950 py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(45rem 24rem at 75% -10%, #14573a 0%, transparent 62%), radial-gradient(35rem 20rem at 15% 110%, #472400 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-md px-4">
        <p className="mb-5 text-center text-xs font-semibold tracking-wide text-gold-400">
          {t("app.name")} · {t("app.tagline")}
        </p>
        <div className="rounded-2xl bg-white p-7 shadow-2xl">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
