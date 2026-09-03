"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { userService } from "@/services";
import { ENTITY_STATUS } from "@/constants/status";
import { REGIONS } from "@/mocks/data";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";
import { exportToCsv } from "@/utils/export";
import { toast } from "@/store/toast";
import type { EndUser } from "@/types";

export default function UsersPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [selected, setSelected] = useState<EndUser | null>(null);
  const [confirm, setConfirm] = useState<{ user: EndUser; action: "delete" | "suspend" } | null>(null);

  const list = useListQuery<EndUser>({
    key: "users",
    fetcher: userService.list,
    defaultSort: { by: "createdAt", dir: "desc" },
  });

  const columns: Column<EndUser>[] = [
    {
      key: "name",
      header: "Nom",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div>
            <p className="font-medium text-foreground">{u.name}</p>
            <p className="text-caption">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Téléphone", render: (u) => <span className="text-muted">{u.phone}</span> },
    { key: "region", header: "Région", render: (u) => u.region },
    { key: "ticketsPurchased", header: "Billets", sortable: true, align: "right", render: (u) => formatNumber(u.ticketsPurchased) },
    { key: "totalSpent", header: "Total dépensé", sortable: true, align: "right", render: (u) => <span className="font-medium">{formatCurrency(u.totalSpent)}</span> },
    { key: "status", header: "Statut", render: (u) => <StatusBadge meta={ENTITY_STATUS[u.status]} /> },
    { key: "createdAt", header: "Inscrit le", sortable: true, render: (u) => <span className="text-muted">{formatDate(u.createdAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <Dropdown
          trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
          items={[
            { label: "Voir le profil", icon: Eye, onClick: () => setSelected(u) },
            u.status === "active"
              ? { label: "Suspendre", icon: Ban, onClick: () => setConfirm({ user: u, action: "suspend" }) }
              : { label: "Activer", icon: CheckCircle2, onClick: () => toast.success("Utilisateur activé", u.name) },
            { divider: true, label: "" },
            { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => setConfirm({ user: u, action: "delete" }) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Utilisateurs"
        description="Gérez les comptes clients de la plateforme."
      />

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Rechercher un utilisateur…"
        onExport={() => {
          exportToCsv("utilisateurs", list.data?.data ?? [], [
            { key: "name", header: "Nom" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Téléphone" },
            { key: "region", header: "Région" },
            { key: "totalSpent", header: "Total dépensé" },
            { key: "status", header: "Statut" },
          ]);
          toast.success("Export CSV généré");
        }}
        filters={[
          {
            key: "region",
            placeholder: "Toutes les régions",
            value: list.filters.region ?? "all",
            options: REGIONS.map((r) => ({ value: r, label: r })),
            onChange: (v) => list.setFilter("region", v),
          },
          {
            key: "status",
            placeholder: "Tous les statuts",
            value: list.filters.status ?? "all",
            options: [
              { value: "active", label: "Actif" },
              { value: "suspended", label: "Suspendu" },
              { value: "pending", label: "En attente" },
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
          rowKey={(u) => u.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onSort={list.toggleSort}
          onRowClick={(u) => setSelected(u)}
          emptyTitle="Aucun utilisateur"
          emptyDescription="Aucun utilisateur ne correspond à vos critères."
        />
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected?.email}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={selected.name} size="lg" />
              <div>
                <p className="text-h4 text-foreground">{selected.name}</p>
                <StatusBadge meta={ENTITY_STATUS[selected.status]} />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Téléphone" value={selected.phone} />
              <Detail label="Région" value={selected.region} />
              <Detail label="Billets achetés" value={formatNumber(selected.ticketsPurchased)} />
              <Detail label="Total dépensé" value={formatCurrency(selected.totalSpent)} />
              <Detail label="Inscrit le" value={formatDate(selected.createdAt)} />
            </dl>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "delete" ? "Supprimer l'utilisateur ?" : "Suspendre l'utilisateur ?"}
        message={
          confirm?.action === "delete"
            ? "Cette action est irréversible. Toutes les données associées seront supprimées."
            : "L'utilisateur ne pourra plus accéder à son compte."
        }
        confirmLabel={confirm?.action === "delete" ? "Supprimer" : "Suspendre"}
        onConfirm={() => {
          toast.success(
            confirm?.action === "delete" ? "Utilisateur supprimé" : "Utilisateur suspendu",
            confirm?.user.name
          );
        }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label">{label}</dt>
      <dd className="text-body-sm text-foreground mt-0.5">{value}</dd>
    </div>
  );
}
