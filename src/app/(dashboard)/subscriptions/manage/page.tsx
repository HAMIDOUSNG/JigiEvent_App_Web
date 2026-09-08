"use client";

import { useRouter } from "next/navigation";
import { Clock, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { subscriptionService } from "@/services";
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_PERIOD } from "@/constants/status";
import { formatCurrency, formatDate, daysUntil } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Subscription } from "@/types";

export default function SubscriptionManagementPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const router = useRouter();

  const list = useListQuery<Subscription>({
    key: "subscriptions",
    fetcher: subscriptionService.list,
    defaultSort: { by: "endDate", dir: "asc" },
  });

  const all = list.data?.data ?? [];
  const expiringSoon = all.filter((s) => s.status === "active" && daysUntil(s.endDate) <= 30);
  const expired = all.filter((s) => s.status === "expired");

  const columns: Column<Subscription>[] = [
    {
      key: "organizationName",
      header: "Entreprise",
      sortable: true,
      render: (s) => <span className="font-medium text-foreground">{s.organizationName}</span>,
    },
    { key: "planName", header: "Plan", render: (s) => <Badge tone="accent" dot={false}>{s.planName}</Badge> },
    { key: "period", header: "Formule", render: (s) => SUBSCRIPTION_PERIOD[s.period].labelFr },
    { key: "pricePaid", header: "Prix payé", align: "right", sortable: true, render: (s) => formatCurrency(s.pricePaid) },
    { key: "startDate", header: "Début", render: (s) => formatDate(s.startDate) },
    { key: "endDate", header: "Expiration", sortable: true, render: (s) => formatDate(s.endDate) },
    {
      key: "days",
      header: "Jours restants",
      align: "right",
      render: (s) => {
        const d = daysUntil(s.endDate);
        return (
          <span className={cn("font-medium", s.status === "expired" ? "text-error" : d <= 30 ? "text-warning" : "text-foreground")}>
            {s.status === "expired" ? "Expiré" : `${Math.max(d, 0)} j`}
          </span>
        );
      },
    },
    { key: "status", header: "Statut", render: (s) => <StatusBadge meta={SUBSCRIPTION_STATUS[s.status]} /> },
  ];

  return (
    <div className="space-y-5">
      <Link href="/subscriptions" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Plans d&apos;abonnement
      </Link>

      <PageHeader
        title="Gestion des abonnements"
        description="Suivez les abonnements des entreprises : plan, prix payé, échéances et statut."
      />

      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-warning/30 bg-warning-bg p-4">
              <Clock className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{expiringSoon.length} abonnement(s)</span> arrivent bientôt à expiration (≤ 30 jours).
              </p>
            </div>
          )}
          {expired.length > 0 && (
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-error/30 bg-error-bg p-4">
              <XCircle className="h-5 w-5 shrink-0 text-error" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{expired.length} abonnement(s)</span> ont expiré. Ces entreprises ne peuvent plus publier.
              </p>
            </div>
          )}
        </div>
      )}

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Rechercher une entreprise…"
        filters={[
          {
            key: "status",
            placeholder: "Tous statuts",
            value: list.filters.status ?? "all",
            options: Object.entries(SUBSCRIPTION_STATUS).map(([value, m]) => ({ value, label: m.labelFr })),
            onChange: (v) => list.setFilter("status", v),
          },
          {
            key: "period",
            placeholder: "Toutes formules",
            value: list.filters.period ?? "all",
            options: Object.entries(SUBSCRIPTION_PERIOD).map(([value, m]) => ({ value, label: m.labelFr })),
            onChange: (v) => list.setFilter("period", v),
          },
        ]}
      />

      {list.isError ? (
        <ErrorState onRetry={list.refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={all}
          rowKey={(s) => s.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onSort={list.toggleSort}
          onRowClick={(s) => router.push(`/organizations/${s.organizationId}`)}
          emptyTitle="Aucun abonnement"
        />
      )}
    </div>
  );
}
