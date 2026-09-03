"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Toolbar } from "@/components/ui/Toolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useListQuery } from "@/hooks/useListQuery";
import { paymentService } from "@/services";
import { PAYMENT_STATUS, PAYMENT_METHOD_LABEL } from "@/constants/status";
import { organizations } from "@/mocks/data";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { exportToCsv } from "@/utils/export";
import { toast } from "@/store/toast";
import type { Payment } from "@/types";

export default function PaymentsPage() {
  useRequireAuth(["SUPER_ADMIN"]);

  const list = useListQuery<Payment>({
    key: "payments",
    fetcher: paymentService.list,
    defaultSort: { by: "createdAt", dir: "desc" },
  });

  const columns: Column<Payment>[] = [
    { key: "transactionId", header: "Transaction", render: (p) => <span className="font-medium text-foreground">{p.transactionId}</span> },
    { key: "orderRef", header: "Commande", render: (p) => <span className="text-muted">{p.orderRef}</span> },
    { key: "customerName", header: "Client", render: (p) => p.customerName },
    { key: "organizationName", header: "Organisation", render: (p) => p.organizationName },
    { key: "amount", header: "Montant", sortable: true, align: "right", render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span> },
    { key: "method", header: "Méthode", render: (p) => PAYMENT_METHOD_LABEL[p.method] },
    { key: "status", header: "Statut", render: (p) => <StatusBadge meta={PAYMENT_STATUS[p.status]} /> },
    { key: "createdAt", header: "Date", sortable: true, render: (p) => <span className="text-muted">{formatDateTime(p.createdAt)}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Paiements" description="Transactions via Orange Money, Moov Money, carte bancaire." />

      <Toolbar
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Transaction, commande, client…"
        onExport={() => { exportToCsv("paiements", list.data?.data ?? []); toast.success("Export CSV généré"); }}
        filters={[
          {
            key: "method",
            placeholder: "Toutes méthodes",
            value: list.filters.method ?? "all",
            options: Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label })),
            onChange: (v) => list.setFilter("method", v),
          },
          {
            key: "status",
            placeholder: "Tous statuts",
            value: list.filters.status ?? "all",
            options: Object.entries(PAYMENT_STATUS).map(([value, m]) => ({ value, label: m.labelFr })),
            onChange: (v) => list.setFilter("status", v),
          },
          {
            key: "organizationId",
            placeholder: "Organisation",
            value: list.filters.organizationId ?? "all",
            options: organizations.map((o) => ({ value: o.id, label: o.name })),
            onChange: (v) => list.setFilter("organizationId", v),
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
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onSort={list.toggleSort}
          emptyTitle="Aucun paiement"
        />
      )}
    </div>
  );
}
