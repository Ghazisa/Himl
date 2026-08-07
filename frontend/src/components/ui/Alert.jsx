import { cva } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const alertVariants = cva("flex gap-3 rounded-xl border px-4 py-3 text-sm", {
  variants: {
    tone: {
      error: "bg-red-50 border-red-300 text-red-900",
      success: "bg-sa-50 border-sa-600 text-sa-900",
      info: "bg-gold-100 border-gold-600 text-gold-950",
    },
  },
  defaultVariants: { tone: "error" },
});

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info };

/** Accepts a string or an array of messages (as returned by `readErrors`). */
export function Alert({ tone = "error", children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={alertVariants({ tone })}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {Array.isArray(children) ? (
          <ul className="space-y-1">
            {children.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
