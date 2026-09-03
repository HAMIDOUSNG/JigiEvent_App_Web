"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SuperAdminDashboard } from "@/features/dashboard/SuperAdminDashboard";
import { AdminDashboard } from "@/features/dashboard/AdminDashboard";
import { useAuthStore } from "@/store/auth";
import { useI18n } from "@/i18n/I18nProvider";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("dashboard.welcome")}, ${user?.name?.split(" ")[0] ?? ""}`}
        description={
          user?.role === "SUPER_ADMIN"
            ? t("dashboard.overview")
            : `${user?.organizationName} — ${t("dashboard.title")}`
        }
      />
      {user?.role === "SUPER_ADMIN" ? (
        <SuperAdminDashboard />
      ) : (
        <AdminDashboard orgId={user?.organizationId ?? "org-1"} />
      )}
    </div>
  );
}
