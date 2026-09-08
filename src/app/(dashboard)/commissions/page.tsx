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
import { currencyForCountry, getCountry } from "@/constants/countries";
import { REFERENCE_CURRENCY, countryAmountToReference } from "@/constants/exchange";
import type { Organization } from "@/types";

const COMMISSION_RATE = 0.12;

interface CommissionRow {
  id: string;
  name: string;
  countryCode: string;
  ticketSales: number;
  commission: number;
  orgRevenue: number;
  /** Commission convertie en devise de référence, pour le total consolidé. */
  commissionRef: number;
}

export default function CommissionsPage() {
  useRequireAuth(["SUPER_ADMIN"]);

  const { data, isLoading } = useQuery({
    queryKey: ["commissions"],
    queryFn: () => organizationService.list({ pageSize: 100 }),
  });

  const rows: CommissionRow[] = (data?.data ?? []).map((o: Organization) => {
    const commission = Math.round(o.revenue * COMMISSION_RATE);
    return {
      id: o.id,
      name: o.name,
      countryCode: o.countryCode,
      ticketSales: o.revenue,
      commission,
      orgRevenue: Math.round(o.revenue * (1 - COMMISSION_RATE)),
      commissionRef: countryAmountToReference(commission, o.countryCode),
    };
  });

  // Totaux consolidés : convertis en devise de référence (XOF).
  const totalSalesRef = rows.reduce((s, r) => s + countryAmountToReference(r.ticketSales, r.countryCode), 0);
  const totalCommissionRef = rows.reduce((s, r) => s + r.commissionRef, 0);
  const totalOrgRef = rows.reduce((s, r) => s + countryAmountToReference(r.orgRevenue, r.countryCode), 0);
  const refHint = `Consolidé en ${REFERENCE_CURRENCY.symbol}`;

  const columns: Column<CommissionRow>[] = [
    {
      key: "name",
      header: "Organisation",
      render: (r) => {
        const c = getCountry(r.countryCode);
        return (
          <div>
            <p className="font-medium text-foreground">{r.name}</p>
            <p className="text-caption">{c ? `${c.flag} ${c.name}` : r.countryCode}</p>
          </div>
        );
      },
    },
    { key: "ticketSales", header: "Ventes de billets", align: "right", render: (r) => formatCurrency(r.ticketSales, currencyForCountry(r.countryCode)) },
    { key: "commission", header: "Commission (12%)", align: "right", render: (r) => <span className="font-semibold text-primary">{formatCurrency(r.commission, currencyForCountry(r.countryCode))}</span> },
    { key: "orgRevenue", header: "Revenu organisation", align: "right", render: (r) => formatCurrency(r.orgRevenue, currencyForCountry(r.countryCode)) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Commissions" description="Commissions prélevées sur les ventes de billets. Montants par entreprise dans leur devise locale ; totaux consolidés en FCFA." />

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Ventes de billets" value={formatCurrencyCompact(totalSalesRef, REFERENCE_CURRENCY)} icon={TrendingUp} tone="primary" hint={refHint} />
          <StatCard label="Commission plateforme" value={formatCurrencyCompact(totalCommissionRef, REFERENCE_CURRENCY)} icon={Percent} tone="secondary" hint="12% des ventes · consolidé" />
          <StatCard label="Revenu organisations" value={formatCurrencyCompact(totalOrgRef, REFERENCE_CURRENCY)} icon={Building2} tone="accent" hint={refHint} />
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
