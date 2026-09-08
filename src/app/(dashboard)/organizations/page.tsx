"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { organizationService } from "@/services";
import { ENTITY_STATUS } from "@/constants/status";
import { categories, REGIONS } from "@/mocks/data";
import { formatCurrency } from "@/utils/format";
import { exportToCsv } from "@/utils/export";
import { toast } from "@/store/toast";
import type { Organization } from "@/types";

const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

export default function OrganizationsPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const router = useRouter();

  const list = useListQuery<Organization>({
    key: "organizations",
    fetcher: organizationService.list,
    defaultSort: { by: "revenue", dir: "desc" },
  });

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Organisation",
      sortable: true,
      render: (o) => (
        <div className="flex items-center gap-3">
          <Avatar name={o.name} size="sm" />
          <div>
            <p className="font-medium text-foreground">{o.name}</p>
            <p className="text-caption">{o.email}</p>
          </div>
        </div>
      ),
    },
    { key: "categoryId", header: "Catégorie", render: (o) => catName(o.categoryId) },
    {
      key: "type",
      header: "Type",
      render: (o) => (
        <Badge tone={o.type === "public" ? "info" : "neutral"} dot={false}>
          {o.type === "public" ? "Publique" : "Privée"}
        </Badge>
      ),
    },
    { key: "region", header: "Région", render: (o) => `${o.city}, ${o.region}` },
    { key: "adminName", header: "Admin", render: (o) => o.adminName },
    { key: "eventsCount", header: "Événements", sortable: true, align: "right", render: (o) => o.eventsCount },
    { key: "revenue", header: "Chiffre d'affaires", sortable: true, align: "right", render: (o) => <span className="font-semibold">{formatCurrency(o.revenue)}</span> },
    { key: "status", header: "Statut", render: (o) => <StatusBadge meta={ENTITY_STATUS[o.status]} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organisations"
        description="Entités publiques et privées de la plateforme."
        action={
          <Button onClick={() => router.push("/organizations/create")}>
            <Plus className="h-4 w-4" /> Nouveau compte
          </Button>
        }
      />

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Rechercher une organisation…"
        onExport={() => {
          exportToCsv("organisations", list.data?.data ?? []);
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
            key: "type",
            placeholder: "Tous types",
            value: list.filters.type ?? "all",
            options: [
              { value: "private", label: "Privée" },
              { value: "public", label: "Publique" },
            ],
            onChange: (v) => list.setFilter("type", v),
          },
          {
            key: "region",
            placeholder: "Toutes régions",
            value: list.filters.region ?? "all",
            options: REGIONS.map((r) => ({ value: r, label: r })),
            onChange: (v) => list.setFilter("region", v),
          },
        ]}
      />

      {list.isError ? (
        <ErrorState onRetry={list.refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={list.data?.data ?? []}
          rowKey={(o) => o.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onSort={list.toggleSort}
          onRowClick={(o) => router.push(`/organizations/${o.id}`)}
          emptyTitle="Aucune organisation"
        />
      )}
    </div>
  );
}
