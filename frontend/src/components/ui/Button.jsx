import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

/**
 * Colour pairs are chosen to clear WCAG AA against their intended surface.
 * Adding a variant here is the only place a new button colour should appear.
 */
export const buttonVariants = cva(
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
