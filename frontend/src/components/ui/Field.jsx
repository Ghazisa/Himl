import { cloneElement, useId } from "react";
import { cn } from "../../lib/cn";

const controlClass =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 transition-colors";

/**
 * Wraps a control with its label, hint and error, wiring `aria-describedby`
 * and `aria-invalid` so every form in the app is accessible by default.
 * Pass `children` to use a select/textarea instead of the default input.
 */
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
