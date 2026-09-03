"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Ticket, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DetailList, DetailRow } from "@/components/ui/DetailList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/States";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { orderService } from "@/services";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD_LABEL } from "@/constants/status";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { toast } from "@/store/toast";

export default function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  useRequireAuth();
  const { id } = use(params);
  const [refundOpen, setRefundOpen] = useState(false);

  const { data: order, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => orderService.get(id) });

  if (isLoading) return <SkeletonCards count={3} />;
  if (!order) return <EmptyState title="Commande introuvable" />;

  const canRefund = order.status === "paid";

  return (
    <div className="space-y-5">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Commandes
      </Link>

      <PageHeader
        title={order.reference}
        description={`Commande passée le ${formatDateTime(order.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge meta={ORDER_STATUS[order.status]} />
            {canRefund && (
              <Button variant="outline" onClick={() => setRefundOpen(true)}>
                <RotateCcw className="h-4 w-4" /> Rembourser
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Informations de la commande</CardTitle></CardHeader>
          <CardBody>
            <DetailList>
              <DetailRow label="Client" value={order.customerName} />
              <DetailRow label="E-mail" value={order.customerEmail} />
              <DetailRow label="Événement" value={order.eventName} />
              <DetailRow label="Nombre de billets" value={String(order.ticketsCount)} />
              <DetailRow label="Montant total" value={<span className="font-semibold">{formatCurrency(order.amount)}</span>} />
              <DetailRow label="Date" value={formatDateTime(order.createdAt)} />
            </DetailList>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Paiement</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-muted">Méthode</span>
              <span className="text-sm font-medium text-foreground">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-muted">Statut</span>
              <StatusBadge meta={PAYMENT_STATUS[order.paymentStatus]} />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-body-sm text-muted">Total</span>
              <span className="text-h4 text-foreground">{formatCurrency(order.amount)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Billets ({order.ticketCodes.length})</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {order.ticketCodes.map((code) => (
              <div key={code} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface-2 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary">
                  <Ticket className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-caption">Code billet</p>
                  <p className="font-mono text-sm font-medium text-foreground">{code}</p>
                </div>
                <Badge tone="success" className="ml-auto">Valide</Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Rembourser la commande ?"
        message={`Le montant de ${formatCurrency(order.amount)} sera remboursé au client. Cette action est irréversible.`}
        confirmLabel="Rembourser"
        onConfirm={() => toast.success("Remboursement effectué", order.reference)}
      />
    </div>
  );
}
