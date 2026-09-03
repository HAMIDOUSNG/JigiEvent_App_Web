"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, Ban, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { adminService } from "@/services";
import { ENTITY_STATUS, LICENSE_STATUS } from "@/constants/status";
import { categories, REGIONS } from "@/mocks/data";
import { formatCurrency } from "@/utils/format";
import { exportToCsv } from "@/utils/export";
import { toast } from "@/store/toast";
import type { AdminAccount } from "@/types";

const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

export default function AdminsPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [confirm, setConfirm] = useState<AdminAccount | null>(null);

  const list = useListQuery<AdminAccount>({
    key: "admins",
    fetcher: adminService.list,
    defaultSort: { by: "revenue", dir: "desc" },
  });

  const columns: Column<AdminAccount>[] = [
    {
      key: "organizationName",
      header: "Organisation",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.organizationName} size="sm" />
          <div>
            <p className="font-medium text-foreground">{a.organizationName}</p>
            <p className="text-caption">{a.name}</p>
          </div>
        </div>
      ),
    },
    { key: "categoryId", header: "Catégorie", render: (a) => catName(a.categoryId) },
    { key: "region", header: "Région", render: (a) => a.region },
    { key: "licenseType", header: "Licence", render: (a) => <Badge tone="accent" dot={false}>{a.licenseType}</Badge> },
    { key: "licenseStatus", header: "État licence", render: (a) => <StatusBadge meta={LICENSE_STATUS[a.licenseStatus]} /> },
    { key: "eventsCount", header: "Événements", sortable: true, align: "right", render: (a) => a.eventsCount },
    { key: "revenue", header: "Chiffre d'affaires", sortable: true, align: "right", render: (a) => <span className="font-semibold">{formatCurrency(a.revenue)}</span> },
    { key: "status", header: "Statut", render: (a) => <StatusBadge meta={ENTITY_STATUS[a.status]} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <Dropdown
          trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
          items={[
            { label: "Voir les détails", icon: Eye, onClick: () => toast.info("Détails", a.organizationName) },
            { label: "Suspendre", icon: Ban, tone: "danger", onClick: () => setConfirm(a) },
          ]}
        />
      ),
    },
  ];

  // Revenue ranking (top 3)
  const ranking = [...(list.data?.data ?? [])].sort((a, b) => b.revenue - a.revenue).slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admins / Organisateurs"
        description="Filtrez par catégorie, région, licence et chiffre d'affaires."
      />

      {/* Revenue ranking */}
      {list.sortBy === "revenue" && ranking.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ranking.map((a, i) => (
            <div key={a.id} className="card-surface flex items-center gap-3 p-4">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${i === 0 ? "bg-accent-50 text-accent-600" : "bg-sand text-muted"}`}>
                <Trophy className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">#{i + 1} {a.organizationName}</p>
                <p className="text-caption">{formatCurrency(a.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Rechercher un admin…"
        onExport={() => {
          exportToCsv("admins", list.data?.data ?? [], [
            { key: "organizationName", header: "Organisation" },
            { key: "name", header: "Admin" },
            { key: "region", header: "Région" },
            { key: "licenseType", header: "Licence" },
            { key: "revenue", header: "Chiffre d'affaires" },
          ]);
          toast.success("Export CSV généré");
        }}
        filters={[
          {
            key: "categoryId",
            placeholder: "Toutes catégories",
            value: list.filters.categoryId ?? "all",
            options: categories.map((c) => ({ value: c.id, label: c.name })),
            onChange: (v) => list.setFilter("categoryId", v),
          },
          {
            key: "region",
            placeholder: "Toutes régions",
            value: list.filters.region ?? "all",
            options: REGIONS.map((r) => ({ value: r, label: r })),
            onChange: (v) => list.setFilter("region", v),
          },
          {
            key: "licenseType",
            placeholder: "Toutes licences",
            value: list.filters.licenseType ?? "all",
            options: [
              { value: "Premium", label: "Premium" },
              { value: "Business", label: "Business" },
              { value: "Standard", label: "Standard" },
            ],
            onChange: (v) => list.setFilter("licenseType", v),
          },
          {
            key: "status",
            placeholder: "Tous statuts",
            value: list.filters.status ?? "all",
            options: [
              { value: "active", label: "Actif" },
              { value: "suspended", label: "Suspendu" },
            ],
            onChange: (v) => list.setFilter("status", v),
          },
        ]}
      />

      {list.isError ? (
        <ErrorState onRetry={list.refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={list.data?.data ?? []}
          rowKey={(a) => a.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onSort={list.toggleSort}
          emptyTitle="Aucun admin"
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Suspendre l'organisateur ?"
        message="L'admin et son organisation ne pourront plus publier d'événements."
        confirmLabel="Suspendre"
        onConfirm={() => toast.success("Organisateur suspendu", confirm?.organizationName)}
      />
    </div>
  );
}
