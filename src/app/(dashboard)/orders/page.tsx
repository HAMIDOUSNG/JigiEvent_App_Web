"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { orderService } from "@/services";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD_LABEL } from "@/constants/status";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { exportToCsv } from "@/utils/export";
import { toast } from "@/store/toast";
import { useAuthStore } from "@/store/auth";
import type { Order } from "@/types";

export default function OrdersPage() {
  useRequireAuth();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSA = user?.role === "SUPER_ADMIN";

  const list = useListQuery<Order>({
    key: "orders",
    fetcher: (params) =>
      isSA || !user?.organizationId
        ? orderService.list(params)
        : orderService.byOrg(user.organizationId, params),
    defaultSort: { by: "createdAt", dir: "desc" },
  });

  const columns: Column<Order>[] = [
    { key: "reference", header: "Commande", render: (o) => <span className="font-medium text-foreground">{o.reference}</span> },
    { key: "customerName", header: "Client", render: (o) => (
      <div>
        <p className="text-foreground">{o.customerName}</p>
        <p className="text-caption">{o.customerEmail}</p>
      </div>
    ) },
    { key: "eventName", header: "Événement", render: (o) => o.eventName },
    { key: "ticketsCount", header: "Billets", align: "right", render: (o) => o.ticketsCount },
    { key: "amount", header: "Montant", sortable: true, align: "right", render: (o) => <span className="font-semibold">{formatCurrency(o.amount)}</span> },
    { key: "paymentMethod", header: "Paiement", render: (o) => PAYMENT_METHOD_LABEL[o.paymentMethod] },
    { key: "paymentStatus", header: "État paiement", render: (o) => <StatusBadge meta={PAYMENT_STATUS[o.paymentStatus]} /> },
    { key: "status", header: "Statut", render: (o) => <StatusBadge meta={ORDER_STATUS[o.status]} /> },
    { key: "createdAt", header: "Date", sortable: true, render: (o) => <span className="text-muted">{formatDateTime(o.createdAt)}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Commandes" description={isSA ? "Toutes les commandes de la plateforme." : "Commandes de vos événements."} />

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Référence, client, événement…"
        onExport={() => { exportToCsv("commandes", list.data?.data ?? []); toast.success("Export CSV généré"); }}
        filters={[
          {
            key: "status",
            placeholder: "Tous statuts",
            value: list.filters.status ?? "all",
            options: Object.entries(ORDER_STATUS).map(([value, m]) => ({ value, label: m.labelFr })),
            onChange: (v) => list.setFilter("status", v),
          },
          {
            key: "paymentMethod",
            placeholder: "Toutes méthodes",
            value: list.filters.paymentMethod ?? "all",
            options: Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label })),
            onChange: (v) => list.setFilter("paymentMethod", v),
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
          onRowClick={(o) => router.push(`/orders/${o.id}`)}
          emptyTitle="Aucune commande"
        />
      )}
    </div>
  );
}
