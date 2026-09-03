"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg";
}

const WIDTHS = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" };

export function Drawer({ open, onClose, title, description, children, footer, width = "md" }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#2a211b]/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-lg",
          WIDTHS[width]
        )}
        style={{ animation: "h-slide-in 0.26s ease-out" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {title && <h2 className="text-h4 text-foreground">{title}</h2>}
            {description && <p className="text-body-sm text-muted mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand hover:text-foreground focus-ring"
            aria-label="Fermer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-border bg-surface-2 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
      <style>{`@keyframes h-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>,
    document.body
  );
}
