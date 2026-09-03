import { cn } from "@/utils/cn";
import type { BadgeTone } from "@/constants/status";

const TONE_STYLES: Record<BadgeTone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  accent: "bg-accent-50 text-accent-600",
  neutral: "bg-sand text-foreground-soft",
};

const DOT_STYLES: Record<BadgeTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
  accent: "bg-accent",
  neutral: "bg-muted",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ tone = "neutral", children, dot = true, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[tone])} aria-hidden />}
      {children}
    </span>
  );
}
