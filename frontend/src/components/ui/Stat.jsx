import { cn } from "../../lib/cn";

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
