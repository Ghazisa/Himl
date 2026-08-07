import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        pending: "bg-gold-100 text-gold-950 border-gold-500",
        accepted: "bg-sa-100 text-sa-900 border-sa-500",
        done: "bg-sa-700 text-white border-sa-700",
        negative: "bg-red-50 text-red-900 border-red-400",
        neutral: "bg-gray-100 text-gray-800 border-gray-300",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** Maps every request and trip status onto a shared set of tones. */
const STATUS_TONES = {
  pending: "pending",
  scheduled: "pending",
  accepted: "accepted",
  in_transit: "accepted",
  delivered: "done",
  declined: "negative",
  cancelled: "neutral",
};

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <span className={badgeVariants({ tone: STATUS_TONES[status] })}>{t(`status.${status}`)}</span>;
}
