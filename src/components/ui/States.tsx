"use client";

import { cn } from "@/utils/cn";
import { Inbox, AlertCircle, type LucideIcon } from "lucide-react";
import { Button } from "./Button";

// ----- Empty State -----
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="pattern-kente flex h-16 w-16 items-center justify-center rounded-full border border-border">
        <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-h4 text-foreground mt-4">{title}</h3>
      {description && <p className="text-body-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ----- Error State -----
export function ErrorState({
  title = "Une erreur est survenue.",
  description = "Veuillez réessayer.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-bg">
        <AlertCircle className="h-7 w-7 text-error" strokeWidth={1.5} />
      </div>
      <h3 className="text-h4 text-foreground mt-4">{title}</h3>
      <p className="text-body-sm text-muted mt-1">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
