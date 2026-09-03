"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { navForRole } from "@/constants/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/store/auth";
import { Logo } from "./Logo";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "SUPER_ADMIN";
  const sections = navForRole(role);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button
          onClick={onCloseMobile}
          className="text-muted hover:text-foreground lg:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-6">
        {sections.map((section, si) => (
          <div key={si} className="mb-1">
            {section.titleFr && (
              <p className="px-3 pb-1.5 pt-4 text-label">
                {locale === "fr" ? section.titleFr : section.titleEn}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors focus-ring",
                        active
                          ? "bg-primary-50 text-primary-700"
                          : "text-foreground-soft hover:bg-sand hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted group-hover:text-foreground")}
                        strokeWidth={2}
                      />
                      {locale === "fr" ? item.labelFr : item.labelEn}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-[var(--radius-md)] pattern-kente border border-border p-3">
          <p className="text-xs font-semibold text-secondary">Horizon360</p>
          <p className="text-caption mt-0.5">
            {locale === "fr" ? "Gestion événementielle" : "Event management"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        {content}
      </aside>

      {/* Mobile / tablet drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[#2a211b]/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-surface animate-fade-in">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
