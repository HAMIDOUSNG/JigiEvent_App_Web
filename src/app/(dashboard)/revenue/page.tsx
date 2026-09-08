"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Landmark, Building2, Percent, RotateCcw, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { RevenueAreaChart, HorizontalBarChart, DonutChart, CHART_PALETTE } from "@/components/charts";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { analyticsService, dashboardService, organizationService } from "@/services";
import { formatCurrency, formatCurrencyCompact } from "@/utils/format";
import { REFERENCE_CURRENCY } from "@/constants/exchange";
import { currencyForCountry } from "@/constants/countries";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/utils/cn";

const PERIODS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "3m", label: "3 mois" },
  { value: "12m", label: "12 mois" },
  { value: "custom", label: "Personnalisé" },
];

export default function RevenuePage() {
  useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const isSA = user?.role === "SUPER_ADMIN";
  const [period, setPeriod] = useState("12m");

  const { data: revenue } = useQuery({ queryKey: ["an", "revenue"], queryFn: analyticsService.revenueOverTime });
  const { data: byCategory } = useQuery({ queryKey: ["an", "byCategory"], queryFn: analyticsService.revenueByCategory });
  const { data: topOrgs } = useQuery({ queryKey: ["an", "topOrgs"], queryFn: analyticsService.topOrganizations });
  const { data: saKpis } = useQuery({ queryKey: ["dash", "sa"], queryFn: dashboardService.superAdminKpis, enabled: isSA });
  const { data: admKpis } = useQuery({
    queryKey: ["dash", "adm", user?.organizationId],
    queryFn: () => dashboardService.adminKpis(user!.organizationId!),
    enabled: !isSA && !!user?.organizationId,
  });
  const { data: myOrg } = useQuery({
    queryKey: ["revenue-org", user?.organizationId],
    queryFn: () => organizationService.get(user!.organizationId!),
    enabled: !isSA && !!user?.organizationId,
  });

  const gross = isSA ? saKpis?.totalRevenue ?? 0 : admKpis?.revenue ?? 0;
  const commission = Math.round(gross * 0.12);
  const orgRevenue = gross - commission;
  const refunds = Math.round(gross * 0.02);
  const net = gross - refunds;

  // SA : montants déjà consolidés en devise de référence (XOF).
  // Admin : montants dans la devise de son pays.
  const currency = isSA ? REFERENCE_CURRENCY : currencyForCountry(myOrg?.countryCode);
  const money = (v: number) => formatCurrencyCompact(v, currency);
  const saHint = isSA ? `Consolidé en ${REFERENCE_CURRENCY.symbol}` : undefined;

  return (
    <div className="space-y-5">
      <PageHeader title="Chiffre d'affaires" description="Analyse financière de la plateforme." />

      {/* Period filter */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              period === p.value
                ? "border-primary bg-primary-50 text-primary-700"
                : "border-border-strong text-foreground-soft hover:bg-sand"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Revenu brut" value={money(gross)} icon={TrendingUp} tone="primary" trend={{ value: 9.8, positive: true }} hint={saHint} />
        {isSA && <StatCard label="Revenu plateforme" value={money(commission)} icon={Landmark} tone="secondary" hint={saHint} />}
        <StatCard label={isSA ? "Revenu organisations" : "Votre revenu"} value={money(orgRevenue)} icon={Building2} tone="accent" hint={saHint} />
        <StatCard label="Commission (12%)" value={money(commission)} icon={Percent} tone="info" />
        <StatCard label="Remboursements" value={money(refunds)} icon={RotateCcw} tone="primary" trend={{ value: 1.2, positive: false }} />
        <StatCard label="Revenu net" value={money(net)} icon={Wallet} tone="secondary" />
      </div>

      <Card>
        <CardHeader><CardTitle>Évolution du chiffre d&apos;affaires</CardTitle></CardHeader>
        <CardBody>{revenue && <RevenueAreaChart data={revenue} formatter={formatCurrency} height={300} />}</CardBody>
      </Card>

      {isSA && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Revenu par organisation</CardTitle></CardHeader>
            <CardBody>{topOrgs && <HorizontalBarChart data={topOrgs} formatter={formatCurrency} />}</CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Revenu par catégorie</CardTitle></CardHeader>
            <CardBody>{byCategory && <DonutChart data={byCategory} formatter={formatCurrency} />}</CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
