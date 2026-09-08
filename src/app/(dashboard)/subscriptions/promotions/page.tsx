"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Pencil, Power, Trash2, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/States";
import { SubscriptionPromotionModal } from "@/features/subscriptions/SubscriptionPromotionForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { subscriptionPromotionService } from "@/services";
import { PROMOTION_STATUS, SUBSCRIPTION_PERIOD } from "@/constants/status";
import { formatDate, formatCurrency } from "@/utils/format";
import { toast } from "@/store/toast";
import type { SubscriptionPromotion } from "@/types";

export default function SubscriptionPromotionsPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPromotion | null>(null);
  const [confirm, setConfirm] = useState<SubscriptionPromotion | null>(null);

  const list = useListQuery<SubscriptionPromotion>({
    key: "sub-promotions",
    fetcher: subscriptionPromotionService.list,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["sub-promotions"] });
    qc.invalidateQueries({ queryKey: ["plans"] });
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(promo: SubscriptionPromotion) {
    setEditing(promo);
    setModalOpen(true);
  }

  async function toggleStatus(promo: SubscriptionPromotion) {
    const next = promo.status === "active" ? "draft" : "active";
    await subscriptionPromotionService.setStatus(promo.id, next);
    toast.success(next === "active" ? "Promotion activée" : "Promotion désactivée", promo.name);
    refresh();
  }

  async function remove(promo: SubscriptionPromotion) {
    await subscriptionPromotionService.remove(promo.id);
    toast.success("Promotion supprimée", promo.name);
    refresh();
  }

  const columns: Column<SubscriptionPromotion>[] = [
    {
      key: "name",
      header: "Promotion",
      render: (p) => <span className="font-medium text-foreground">{p.name}</span>,
    },
    { key: "period", header: "Abonnement", render: (p) => <Badge tone="accent" dot={false}>{SUBSCRIPTION_PERIOD[p.period].labelFr}</Badge> },
    {
      key: "discount",
      header: "Réduction",
      render: (p) =>
        p.discountType === "percent"
          ? <Badge tone="info" dot={false}>-{p.discountPercent}%</Badge>
          : <span className="font-medium text-foreground">{formatCurrency(p.promoPrice ?? 0)}</span>,
    },
    { key: "dates", header: "Période", render: (p) => <span className="text-muted">{formatDate(p.startDate)} → {formatDate(p.endDate)}</span> },
    { key: "status", header: "Statut", render: (p) => <StatusBadge meta={PROMOTION_STATUS[p.status]} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <Dropdown
          trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
          items={[
            { label: "Modifier", icon: Pencil, onClick: () => openEdit(p) },
            { label: p.status === "active" ? "Désactiver" : "Activer", icon: Power, onClick: () => toggleStatus(p) },
            { divider: true, label: "" },
            { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => setConfirm(p) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Link href="/subscriptions" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Plans d&apos;abonnement
      </Link>

      <PageHeader
        title="Promotions d'abonnement"
        description="Créez des réductions sur les plans. Le tarif promotionnel s'applique automatiquement pendant la période définie."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouvelle promotion</Button>}
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
          {
            key: "period",
            placeholder: "Tous abonnements",
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
          data={list.data?.data ?? []}
          rowKey={(p) => p.id}
          loading={list.isLoading}
          total={list.data?.total ?? 0}
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          emptyTitle="Aucune promotion"
          emptyDescription="Créez une promotion pour offrir un tarif réduit sur un abonnement."
          emptyAction={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouvelle promotion</Button>}
        />
      )}

      <SubscriptionPromotionModal open={modalOpen} onClose={() => setModalOpen(false)} promotion={editing} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Supprimer la promotion ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirm) return remove(confirm);
        }}
      />
    </div>
  );
}
