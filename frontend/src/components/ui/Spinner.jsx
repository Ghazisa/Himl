import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export function Spinner({ label }) {
  const { t } = useTranslation();
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      {label || t("common.loading")}
    </p>
  );
}
