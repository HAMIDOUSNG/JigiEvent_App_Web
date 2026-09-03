"use client";

import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const baseField =
  "w-full rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-foreground placeholder:text-muted transition-colors focus-ring hover:border-muted disabled:opacity-60 disabled:bg-surface-2";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(({ className, icon, ...props }, ref) => {
  if (icon) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
        <input ref={ref} className={cn(baseField, "h-10 pl-9", className)} {...props} />
      </div>
    );
  }
  return <input ref={ref} className={cn(baseField, "h-10", className)} {...props} />;
});
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseField, "min-h-24 py-2.5", className)} {...props} />
));
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => (
    <select ref={ref} className={cn(baseField, "h-10 appearance-none bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238A7E71' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.65rem center" }} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
);
Select.displayName = "Select";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-caption">{hint}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
