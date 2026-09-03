"use client";

import { useQuery } from "@tanstack/react-query";
import { Percent, TrendingUp, Landmark, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { organizationService } from "@/services";
import { formatCurrency, formatCurrencyCompact } from "@/utils/format";
import type { Organization } from "@/types";

const COMMISSION_RATE = 0.12;

interface CommissionRow {
  id: string;
  name: string;
  ticketSales: number;
  commission: number;
  orgRevenue: number;
}

export default function CommissionsPage() {
  useRequireAuth(["SUPER_ADMIN"]);

  const { data, isLoading } = useQuery({
    queryKey: ["commissions"],
    queryFn: () => organizationService.list({ pageSize: 100 }),
  });

  const rows: CommissionRow[] = (data?.data ?? []).map((o: Organization) => ({
    id: o.id,
    name: o.name,
    ticketSales: o.revenue,
    commission: Math.round(o.revenue * COMMISSION_RATE),
    orgRevenue: Math.round(o.revenue * (1 - COMMISSION_RATE)),
  }));

  const totalSales = rows.reduce((s, r) => s + r.ticketSales, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);
  const totalOrg = rows.reduce((s, r) => s + r.orgRevenue, 0);

  const columns: Column<CommissionRow>[] = [
    { key: "name", header: "Organisation", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "ticketSales", header: "Ventes de billets", align: "right", render: (r) => formatCurrency(r.ticketSales) },
    { key: "commission", header: "Commission (12%)", align: "right", render: (r) => <span className="font-semibold text-primary">{formatCurrency(r.commission)}</span> },
    { key: "orgRevenue", header: "Revenu organisation", align: "right", render: (r) => formatCurrency(r.orgRevenue) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Commissions" description="Commissions prélevées sur les ventes de billets." />

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Ventes de billets" value={formatCurrencyCompact(totalSales)} icon={TrendingUp} tone="primary" />
          <StatCard label="Commission plateforme" value={formatCurrencyCompact(totalCommission)} icon={Percent} tone="secondary" hint="12% des ventes" />
          <StatCard label="Revenu organisations" value={formatCurrencyCompact(totalOrg)} icon={Building2} tone="accent" />
          <StatCard label="Taux moyen" value="12 %" icon={Landmark} tone="info" />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Détail par organisation</CardTitle></CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={rows} rowKey={(r) => r.id} loading={isLoading} emptyTitle="Aucune commission" />
        </CardBody>
      </Card>
    </div>
  );
}
