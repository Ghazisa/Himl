import { cn } from "../../lib/cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-2xl border border-gray-200 bg-white p-5 shadow-sm", className)}
      {...props}
    />
  );
}
