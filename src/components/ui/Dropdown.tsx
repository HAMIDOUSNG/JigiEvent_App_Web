"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { type LucideIcon } from "lucide-react";

export interface DropdownItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  tone?: "default" | "danger";
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export function Dropdown({ trigger, items, align = "right" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex focus-ring rounded-[var(--radius-md)]"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-1 min-w-48 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-lg animate-fade-in",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            if (item.divider) return <div key={i} className="my-1 h-px bg-border" />;
            const Icon = item.icon;
            return (
              <button
                key={i}
                role="menuitem"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  item.tone === "danger"
                    ? "text-error hover:bg-error-bg"
                    : "text-foreground hover:bg-sand"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
