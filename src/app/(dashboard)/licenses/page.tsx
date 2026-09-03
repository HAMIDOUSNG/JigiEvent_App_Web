"use client";

import { Clock, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { licenseService } from "@/services";
import { LICENSE_STATUS } from "@/constants/status";
import { formatCurrency, formatDate, daysUntil } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { License } from "@/types";

export default function LicensesPage() {
  useRequireAuth(["SUPER_ADMIN"]);

  const list = useListQuery<License>({ key: "licenses", fetcher: licenseService.list });

  const all = list.data?.data ?? [];
  const expiring = all.filter((l) => l.status === "expiring_soon");
  const expired = all.filter((l) => l.status === "expired");

  const columns: Column<License>[] = [
    { key: "organizationName", header: "Organisation", render: (l) => <span className="font-medium text-foreground">{l.organizationName}</span> },
    { key: "type", header: "Type de licence", render: (l) => <Badge tone="accent" dot={false}>{l.type}</Badge> },
    { key: "startDate", header: "Début", render: (l) => formatDate(l.startDate) },
    { key: "endDate", header: "Fin", render: (l) => formatDate(l.endDate) },
    {
      key: "days",
      header: "Jours restants",
      align: "right",
      render: (l) => {
        const d = daysUntil(l.endDate);
        return (
          <span className={cn("font-medium", d < 0 ? "text-error" : d <= 30 ? "text-warning" : "text-foreground")}>
            {d < 0 ? "Expirée" : `${d} j`}
          </span>
        );
      },
    },
    { key: "status", header: "Statut", render: (l) => <StatusBadge meta={LICENSE_STATUS[l.status]} /> },
    { key: "revenue", header: "Revenu", align: "right", render: (l) => formatCurrency(l.revenue) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Licences" description="Suivez les licences valides, expirantes et expirées." />

      {/* Alerts */}
      {(expiring.length > 0 || expired.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {expiring.length > 0 && (
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-warning/30 bg-warning-bg p-4">
              <Clock className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{expiring.length} licence(s)</span> expirent bientôt (≤ 30 jours).
              </p>
            </div>
          )}
          {expired.length > 0 && (
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-error/30 bg-error-bg p-4">
              <XCircle className="h-5 w-5 shrink-0 text-error" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{expired.length} licence(s)</span> ont expiré et nécessitent un renouvellement.
              </p>
            </div>
          )}
        </div>
      )}

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Rechercher une licence…"
        filters={[
          {
            key: "status",
            placeholder: "Tous statuts",
            value: list.filters.status ?? "all",
            options: Object.entries(LICENSE_STATUS).map(([value, m]) => ({ value, label: m.labelFr })),
            onChange: (v) => list.setFilter("status", v),
          },
          {
            key: "type",
            placeholder: "Tous types",
            value: list.filters.type ?? "all",
            options: [
              { value: "Premium", label: "Premium" },
              { value: "Business", label: "Business" },
              { value: "Standard", label: "Standard" },
            ],
            onChange: (v) => list.setFilter("type", v),
          },
        ]}
      />

      {list.isError ? (
        <ErrorState onRetry={list.refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={all}
          rowKey={(l) => l.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          emptyTitle="Aucune licence"
        />
      )}
    </div>
  );
}
