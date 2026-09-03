"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore, type ToastTone } from "@/store/toast";
import { cn } from "@/utils/cn";

const emptySubscribe = () => () => {};
/** Returns true only on the client, without a setState-in-effect. */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONE: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-error",
  info: "text-info",
  warning: "text-warning",
};

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore();
  const mounted = useMounted();
  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3.5 shadow-lg animate-fade-in"
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", TONE[t.tone])} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              {t.description && <p className="text-caption mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted hover:text-foreground"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
