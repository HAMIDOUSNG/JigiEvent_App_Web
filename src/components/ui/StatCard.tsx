import { cn } from "@/utils/cn";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; positive?: boolean };
  tone?: "primary" | "secondary" | "accent" | "info";
  hint?: string;
}

const ICON_TONE = {
  primary: "bg-primary-50 text-primary",
  secondary: "bg-secondary-50 text-secondary",
  accent: "bg-accent-50 text-accent-600",
  info: "bg-info-bg text-info",
};

export function StatCard({ label, value, icon: Icon, trend, tone = "primary", hint }: StatCardProps) {
  return (
    <div className="card-surface p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <span className="text-label">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]", ICON_TONE[tone])}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-h1 font-display text-foreground tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trend.positive ? "text-success" : "text-error"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
        {hint && <span className="text-caption">{hint}</span>}
      </div>
    </div>
  );
}
