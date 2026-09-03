"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Send,
  EyeOff,
  XCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { eventService } from "@/services";
import { EVENT_STATUS } from "@/constants/status";
import { categories, eventTypes, organizations, REGIONS } from "@/mocks/data";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";
import { toast } from "@/store/toast";
import { useAuthStore } from "@/store/auth";
import type { EventItem } from "@/types";

const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

export default function EventsPage() {
  useRequireAuth();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSA = user?.role === "SUPER_ADMIN";
  const [confirm, setConfirm] = useState<{ evt: EventItem; action: "cancel" | "delete" } | null>(null);

  const list = useListQuery<EventItem>({
    key: "events",
    fetcher: eventService.list,
    defaultSort: { by: "startDate", dir: "desc" },
    initialFilters: !isSA && user?.organizationId ? { organizationId: user.organizationId } : {},
  });

  const columns: Column<EventItem>[] = [
    {
      key: "name",
      header: "Événement",
      sortable: true,
      render: (e) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] pattern-kente border border-border text-xs font-bold text-primary">
            {e.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{e.name}</p>
            <p className="text-caption">{catName(e.categoryId)}</p>
          </div>
        </div>
      ),
    },
    ...(isSA
      ? [{ key: "organizationName", header: "Organisation", render: (e: EventItem) => e.organizationName }]
      : []),
    { key: "city", header: "Lieu", render: (e) => `${e.city}, ${e.region}` },
    { key: "startDate", header: "Date", sortable: true, render: (e) => formatDate(e.startDate) },
    {
      key: "tickets",
      header: "Billets",
      align: "right",
      render: (e) => (
        <span className="text-muted">
          <span className="font-medium text-foreground">{formatNumber(e.ticketsSold)}</span> / {formatNumber(e.ticketsTotal)}
        </span>
      ),
    },
    { key: "revenue", header: "Revenu", sortable: true, align: "right", render: (e) => <span className="font-semibold">{formatCurrency(e.revenue)}</span> },
    { key: "status", header: "Statut", render: (e) => <StatusBadge meta={EVENT_STATUS[e.status]} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <Dropdown
          trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
          items={[
            { label: "Voir", icon: Eye, onClick: () => router.push(`/events/${e.id}`) },
            { label: "Modifier", icon: Pencil, onClick: () => router.push(`/events/${e.id}/edit`) },
            { label: "Dupliquer", icon: Copy, onClick: () => toast.success("Événement dupliqué", e.name) },
            e.status === "published"
              ? { label: "Dépublier", icon: EyeOff, onClick: () => toast.info("Événement dépublié", e.name) }
              : { label: "Publier", icon: Send, onClick: () => toast.success("Événement publié", e.name) },
            { label: "Annuler", icon: XCircle, onClick: () => setConfirm({ evt: e, action: "cancel" }) },
            { divider: true, label: "" },
            { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => setConfirm({ evt: e, action: "delete" }) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Événements"
        description={isSA ? "Tous les événements de la plateforme." : "Vos événements."}
        action={
          <Button onClick={() => router.push("/events/create")}>
            <Plus className="h-4 w-4" /> Créer un événement
          </Button>
        }
      />

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Rechercher un événement…"
        filters={[
          {
            key: "categoryId",
            placeholder: "Catégorie",
            value: list.filters.categoryId ?? "all",
            options: categories.map((c) => ({ value: c.id, label: c.name })),
            onChange: (v) => list.setFilter("categoryId", v),
          },
          {
            key: "eventTypeId",
            placeholder: "Type",
            value: list.filters.eventTypeId ?? "all",
            options: eventTypes.map((t) => ({ value: t.id, label: t.name })),
            onChange: (v) => list.setFilter("eventTypeId", v),
          },
          {
            key: "region",
            placeholder: "Région",
            value: list.filters.region ?? "all",
            options: REGIONS.map((r) => ({ value: r, label: r })),
            onChange: (v) => list.setFilter("region", v),
          },
          {
            key: "status",
            placeholder: "Statut",
            value: list.filters.status ?? "all",
            options: Object.entries(EVENT_STATUS).map(([value, m]) => ({ value, label: m.labelFr })),
            onChange: (v) => list.setFilter("status", v),
          },
          ...(isSA
            ? [
                {
                  key: "organizationId",
                  placeholder: "Organisation",
                  value: list.filters.organizationId ?? "all",
                  options: organizations.map((o) => ({ value: o.id, label: o.name })),
                  onChange: (v: string) => list.setFilter("organizationId", v),
                },
              ]
            : []),
        ]}
      />

      {list.isError ? (
        <ErrorState onRetry={list.refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={list.data?.data ?? []}
          rowKey={(e) => e.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onSort={list.toggleSort}
          onRowClick={(e) => router.push(`/events/${e.id}`)}
          emptyTitle="Aucun événement"
          emptyDescription="Créez votre premier événement pour commencer."
          emptyAction={
            <Button onClick={() => router.push("/events/create")}>
              <Plus className="h-4 w-4" /> Créer un événement
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "delete" ? "Supprimer l'événement ?" : "Annuler l'événement ?"}
        message={
          confirm?.action === "delete"
            ? "Cette action est irréversible."
            : "Les acheteurs seront notifiés et remboursés selon la politique en vigueur."
        }
        confirmLabel={confirm?.action === "delete" ? "Supprimer" : "Annuler l'événement"}
        onConfirm={() =>
          toast.success(
            confirm?.action === "delete" ? "Événement supprimé" : "Événement annulé",
            confirm?.evt.name
          )
        }
      />
    </div>
  );
}
