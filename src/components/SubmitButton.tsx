"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that shows a spinner while the form action is pending but
 * keeps its label (per web-interface-guidelines). Enabled until submit begins.
 */
export function SubmitButton({
  children,
  className = "",
  formAction,
  name,
  value,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  formAction?: (formData: FormData) => void;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-busy={pending}
      className={`relative inline-flex items-center justify-center gap-2 disabled:opacity-60 ${className}`}
    >
      {pending && (
        <span
          aria-hidden
          className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
}
