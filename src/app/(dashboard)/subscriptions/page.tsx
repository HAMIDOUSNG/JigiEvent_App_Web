"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { PlanModal } from "@/features/subscriptions/PlanForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { planService } from "@/services";
import { PLAN_STATUS, SUBSCRIPTION_PERIOD_SUFFIX } from "@/constants/status";
import { formatCurrency } from "@/utils/format";
import { toast } from "@/store/toast";
import { cn } from "@/utils/cn";
import type { SubscriptionPlan } from "@/types";

export default function SubscriptionsPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const qc = useQueryClient();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [confirm, setConfirm] = useState<SubscriptionPlan | null>(null);

  const { data: plans, isLoading } = useQuery({ queryKey: ["plans"], queryFn: () => planService.all() });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["plans"] });
    qc.invalidateQueries({ queryKey: ["plans-active"] });
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan);
    setModalOpen(true);
  }

  async function toggleStatus(plan: SubscriptionPlan) {
    const next = plan.status === "active" ? "inactive" : "active";
    await planService.setStatus(plan.id, next);
    toast.success(next === "active" ? "Plan activé" : "Plan désactivé", plan.name);
    refresh();
  }

  async function remove(plan: SubscriptionPlan) {
    await planService.remove(plan.id);
    toast.success("Plan supprimé", plan.name);
    setConfirm(null);
    refresh();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Abonnements"
        description="Créez et configurez les plans proposés aux entreprises. Prix entièrement modifiables."
        action={
          <>
            <Button variant="outline" onClick={() => router.push("/subscriptions/promotions")}>
              Promotions
            </Button>
            <Button variant="outline" onClick={() => router.push("/subscriptions/manage")}>
              Gérer les abonnements
            </Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau plan</Button>
          </>
        }
      />

      {isLoading || !plans ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const eff = planService.effectivePrice(plan);
            const hasPromo = eff.promotion != null && eff.price !== plan.price;
            return (
              <Card key={plan.id} className={cn(plan.status === "inactive" && "opacity-60")}>
                <CardBody className="flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-h3 font-display text-foreground">{plan.name}</h3>
                      <Badge tone="neutral" dot={false} className="mt-1">
                        {SUBSCRIPTION_PERIOD_SUFFIX[plan.period] === "an"
                          ? "Annuel"
                          : SUBSCRIPTION_PERIOD_SUFFIX[plan.period] === "mois"
                          ? "Mensuel"
                          : "Journalier"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge meta={PLAN_STATUS[plan.status]} />
                      <Dropdown
                        trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
                        items={[
                          { label: "Modifier", icon: Pencil, onClick: () => openEdit(plan) },
                          {
                            label: plan.status === "active" ? "Désactiver" : "Activer",
                            icon: Power,
                            onClick: () => toggleStatus(plan),
                          },
                          { divider: true, label: "" },
                          { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => setConfirm(plan) },
                        ]}
                      />
                    </div>
                  </div>

                  <p className="mt-3">
                    {hasPromo && (
                      <span className="mr-2 text-body-sm text-muted line-through">{formatCurrency(plan.price)}</span>
                    )}
                    <span className="text-h1 font-display text-foreground">{formatCurrency(eff.price)}</span>
                    <span className="text-muted"> / {SUBSCRIPTION_PERIOD_SUFFIX[plan.period]}</span>
                  </p>
                  {hasPromo && (
                    <Badge tone="accent" dot={false} className="mt-2 self-start">
                      Promo : {eff.promotion?.name}
                    </Badge>
                  )}

                  {plan.description && <p className="mt-3 text-sm text-muted">{plan.description}</p>}

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground-soft">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button variant="outline" className="mt-6 w-full" onClick={() => openEdit(plan)}>
                    Configurer
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <PlanModal open={modalOpen} onClose={() => setModalOpen(false)} plan={editing} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Supprimer le plan ?"
        message="Cette action est irréversible. Les entreprises abonnées ne seront pas affectées, mais le plan ne pourra plus être souscrit."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirm) return remove(confirm);
        }}
      />
    </div>
  );
}
