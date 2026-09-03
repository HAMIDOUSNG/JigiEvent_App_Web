"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/States";
import { PromotionModal } from "@/features/promotions/PromotionForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { promotionService } from "@/services";
import { PROMOTION_STATUS } from "@/constants/status";
import { formatDate, formatNumber } from "@/utils/format";
import { toast } from "@/store/toast";
import type { Promotion } from "@/types";

export default function PromotionsPage() {
  useRequireAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState<Promotion | null>(null);

  const list = useListQuery<Promotion>({ key: "promotions", fetcher: promotionService.list });

  const columns: Column<Promotion>[] = [
    {
      key: "name",
      header: "Promotion",
      render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          <p className="text-caption font-mono">{p.code}</p>
        </div>
      ),
    },
    { key: "discountPercent", header: "Réduction", render: (p) => <Badge tone="accent" dot={false}>-{p.discountPercent}%</Badge> },
    { key: "applicableEvents", header: "Événements", render: (p) => <span className="text-muted">{p.applicableEvents}</span> },
    { key: "targetAudience", header: "Audience", render: (p) => <span className="text-muted">{p.targetAudience}</span> },
    { key: "period", header: "Période", render: (p) => <span className="text-muted">{formatDate(p.startDate)} → {formatDate(p.endDate)}</span> },
    { key: "usageCount", header: "Utilisations", align: "right", render: (p) => formatNumber(p.usageCount) },
    { key: "status", header: "Statut", render: (p) => <StatusBadge meta={PROMOTION_STATUS[p.status]} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <Dropdown
          trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
          items={[
            { label: "Modifier", icon: Pencil, onClick: () => toast.info("Modifier", p.name) },
            { label: "Dupliquer", icon: Copy, onClick: () => toast.success("Promotion dupliquée", p.name) },
            { divider: true, label: "" },
            { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => setConfirm(p) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Promotions"
        description="Codes promo et réductions pour vos événements."
        action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle promotion</Button>}
      />

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Rechercher une promotion…"
        filters={[
          {
            key: "status",
            placeholder: "Tous statuts",
            value: list.filters.status ?? "all",
            options: Object.entries(PROMOTION_STATUS).map(([value, m]) => ({ value, label: m.labelFr })),
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
          rowKey={(p) => p.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          emptyTitle="Aucune promotion"
          emptyDescription="Créez une promotion pour dynamiser vos ventes."
          emptyAction={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle promotion</Button>}
        />
      )}

      <PromotionModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Supprimer la promotion ?"
        message="Cette action est irréversible. Le code promo ne sera plus utilisable."
        confirmLabel="Supprimer"
        onConfirm={() => toast.success("Promotion supprimée", confirm?.name)}
      />
    </div>
  );
}
