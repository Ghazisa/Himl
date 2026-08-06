import { cloneElement, useId } from "react";
import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "./lib/cn";

/*
 * Design system for Himl.
 *
 * Every visual decision lives here as a `cva` variant rather than as ad-hoc
 * class strings in pages — that is what keeps colour, spacing and typography
 * consistent across screens. Colour pairs are chosen to clear WCAG AA (4.5:1
 * for body text, 3:1 for large text) against their intended surface.
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-sa-700 text-white hover:bg-sa-800",
        secondary: "bg-white text-sa-800 border border-sa-700 hover:bg-sa-50",
        ghost: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
        danger: "bg-white text-red-700 border border-red-400 hover:bg-red-50",
        gold: "bg-gold-500 text-gray-950 hover:bg-gold-400",
        dark: "bg-gray-900 text-white hover:bg-gray-800",
      },
      size: {
        sm: "px-3.5 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({ variant, size, className, icon: Icon, children, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  );
}

const controlClass =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 transition-colors";

export function Field({ label, hint, error, required, children, className, ...inputProps }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ");
  const border = error ? "border-red-600" : "border-gray-300 hover:border-gray-400";

  const shared = {
    id,
    required,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="text-red-700 ms-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children ? (
        cloneElement(children, {
          ...shared,
          className: cn(controlClass, border, children.props.className),
        })
      ) : (
        <input {...shared} className={cn(controlClass, border)} {...inputProps} />
      )}

      {hint && (
        <p id={hintId} className="text-xs text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

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

const ALERT_ICONS = { error: AlertCircle, success: CheckCircle2, info: Info };

export function Alert({ tone = "error", children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  const Icon = ALERT_ICONS[tone];
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

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-2xl border border-gray-200 bg-white p-5 shadow-sm", className)}
      {...props}
    />
  );
}

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", {
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
});

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

export function Spinner({ label }) {
  const { t } = useTranslation();
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      {label || t("common.loading")}
    </p>
  );
}

/** Dark page banner used at the top of every signed-in page. */
export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <header className="relative overflow-hidden bg-gray-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: "radial-gradient(40rem 20rem at 85% -30%, #14573a 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-8">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Icon aria-hidden="true" className="h-5 w-5 text-gold-400" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-gray-200">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}

export function EmptyState({ icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      {Icon && <Icon aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-gray-400" />}
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  );
}

export function Stat({ label, value, icon: Icon, tone = "default" }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center">
      {Icon && <Icon aria-hidden="true" className="mx-auto mb-1 h-4 w-4 text-gray-500" />}
      <p className={cn("text-2xl font-bold", tone === "brand" ? "text-sa-800" : "text-gray-900")}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-600">{label}</p>
    </div>
  );
}

/** Bidi-safe city pair: labelled, and each city isolated so mixed scripts never reorder. */
export function Route({ from, to }) {
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
