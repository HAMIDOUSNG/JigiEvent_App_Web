"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-xs",
        secondary:
          "bg-secondary text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-xs",
        accent: "bg-accent text-[#3a2e12] hover:bg-accent-600 shadow-xs",
        outline:
          "border border-border-strong bg-surface text-foreground hover:bg-surface-2 active:bg-sand",
        ghost: "text-foreground-soft hover:bg-sand hover:text-foreground",
        danger: "bg-error text-white hover:brightness-95 active:brightness-90 shadow-xs",
        subtle: "bg-primary-50 text-primary-700 hover:bg-[#f6e2da]",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
        md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
        lg: "h-11 px-5 text-[0.95rem] rounded-[var(--radius-md)]",
        icon: "h-9 w-9 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
