"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#2a211b]/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-lg animate-fade-in",
          SIZES[size]
        )}
      >
        {(title || description) && (
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
        )}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-border bg-surface-2 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
