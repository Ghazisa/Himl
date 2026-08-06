import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes so later ones reliably win.
 * Without this, a caller passing `bg-white` to a component whose base is
 * `bg-sa-600` gets both classes and an unpredictable result.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
