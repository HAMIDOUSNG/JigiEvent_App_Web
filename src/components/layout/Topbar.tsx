"use client";

import { useRouter } from "next/navigation";
import { Menu, Search, Bell, HelpCircle, LogOut, User, Settings, Globe } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS } from "@/i18n/locale";
import { useAuthStore } from "@/store/auth";

export function Topbar({
  onOpenSidebar,
  onOpenSearch,
}: {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const roleLabel = user?.role === "SUPER_ADMIN" ? t("nav.superadmin") : t("nav.admin");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand lg:hidden focus-ring"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search trigger */}
      <button
        onClick={onOpenSearch}
        className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-[var(--radius-md)] border border-border-strong bg-surface-2 px-3 text-sm text-muted transition-colors hover:border-muted focus-ring"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">{t("common.searchPlaceholder")}</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-1">
        {/* Language */}
        <Dropdown
          trigger={
            <span className="flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-sm text-foreground-soft hover:bg-sand">
              <Globe className="h-4.5 w-4.5" />
              <span className="hidden uppercase sm:inline">{locale}</span>
            </span>
          }
          items={LOCALES.map((l) => ({
            label: LOCALE_LABELS[l],
            onClick: () => setLocale(l),
          }))}
        />

        {/* Help */}
        <button
          className="hidden h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand sm:flex focus-ring"
          aria-label={t("common.help")}
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand focus-ring"
          aria-label={t("common.notifications")}
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
        </button>

        {/* Profile */}
        <Dropdown
          align="right"
          trigger={
            <span className="ml-1 flex items-center gap-2.5 rounded-[var(--radius-md)] py-1 pl-1 pr-2 hover:bg-sand">
              <Avatar name={user?.name ?? "Admin"} size="sm" />
              <span className="hidden text-left leading-tight md:block">
                <span className="block text-sm font-medium text-foreground">{user?.name}</span>
                <span className="block text-caption">
                  {roleLabel} · {user?.organizationName}
                </span>
              </span>
            </span>
          }
          items={[
            { label: t("common.profile"), icon: User, onClick: () => router.push("/settings") },
            { label: t("common.language"), icon: Settings, onClick: () => router.push("/settings") },
            { divider: true, label: "" },
            { label: t("common.logout"), icon: LogOut, tone: "danger", onClick: handleLogout },
          ]}
        />
      </div>
    </header>
  );
}
