import { useTranslation } from "react-i18next";

/**
 * Renders a pickup → drop-off pair. Each city sits in its own <bdi> and carries
 * an explicit label, so an Arabic UI showing Latin city names never reorders
 * them into a misleading direction.
 */
export function CityPair({ from, to }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-normal text-gray-600">{t("transporter.from")}</span>
      <bdi>{from}</bdi>
      <span aria-hidden="true" className="text-gray-600">
        →
      </span>
      <span className="text-xs font-normal text-gray-600">{t("transporter.to")}</span>
      <bdi>{to}</bdi>
    </span>
  );
}
