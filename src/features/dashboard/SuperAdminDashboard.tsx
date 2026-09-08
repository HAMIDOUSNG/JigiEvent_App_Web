"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  CalendarDays,
  Ticket,
  TrendingUp,
  Percent,
  KeyRound,
  Clock,
  Building2,
  BadgeCheck,
  XCircle,
  Megaphone,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import {
  RevenueAreaChart,
  MultiLineChart,
  GroupedBarChart,
  HorizontalBarChart,
  CHART_PALETTE,
} from "@/components/charts";
import {
  dashboardService,
  analyticsService,
} from "@/services";
import { formatCurrencyCompact, formatCompactNumber, formatCurrency } from "@/utils/format";
import { useI18n } from "@/i18n/I18nProvider";

export function SuperAdminDashboard() {
  const { t } = useI18n();
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["dashboard", "sa", "kpis"],
    queryFn: () => dashboardService.superAdminKpis(),
  });
  const { data: subKpis } = useQuery({
    queryKey: ["dashboard", "sa", "subscription-kpis"],
    queryFn: () => dashboardService.subscriptionKpis(),
  });
  const { data: revenue } = useQuery({ queryKey: ["an", "revenue"], queryFn: analyticsService.revenueOverTime });
  const { data: tickets } = useQuery({ queryKey: ["an", "tickets"], queryFn: analyticsService.ticketsOverTime });
  const { data: eventsBreak } = useQuery({ queryKey: ["an", "events"], queryFn: analyticsService.eventsBreakdown });
  const { data: usersRegion } = useQuery({ queryKey: ["an", "usersRegion"], queryFn: analyticsService.usersByRegion });

  return (
    <div className="space-y-6">
      {isLoading || !kpis ? (
        <SkeletonCards count={8} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("kpi.totalUsers")} value={formatCompactNumber(kpis.totalUsers)} icon={Users} tone="primary" trend={{ value: 12.4, positive: true }} />
          <StatCard label={t("kpi.totalAdmins")} value={String(kpis.totalAdmins)} icon={ShieldCheck} tone="secondary" trend={{ value: 3.1, positive: true }} />
          <StatCard label={t("kpi.totalEvents")} value={String(kpis.totalEvents)} icon={CalendarDays} tone="accent" trend={{ value: 8.7, positive: true }} />
          <StatCard label={t("kpi.ticketsSold")} value={formatCompactNumber(kpis.ticketsSold)} icon={Ticket} tone="info" trend={{ value: 15.2, positive: true }} />
          <StatCard label={t("kpi.totalRevenue")} value={formatCurrencyCompact(kpis.totalRevenue)} icon={TrendingUp} tone="primary" trend={{ value: 9.8, positive: true }} hint="Consolidé en FCFA" />
          <StatCard label={t("kpi.commission")} value={formatCurrencyCompact(kpis.commission)} icon={Percent} tone="secondary" hint="12% · consolidé FCFA" />
          <StatCard label={t("kpi.activeLicenses")} value={String(kpis.activeLicenses)} icon={KeyRound} tone="accent" />
          <StatCard label={t("kpi.pendingEvents")} value={String(kpis.pendingEvents)} icon={Clock} tone="info" hint="à valider" />
        </div>
      )}

      {/* Suivi des abonnements & entreprises */}
      {subKpis && (
        <div>
          <h2 className="mb-3 text-h4 text-foreground">Abonnements & entreprises</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Entreprises" value={String(subKpis.totalCompanies)} icon={Building2} tone="primary" />
            <StatCard label="Abonnements actifs" value={String(subKpis.activeSubscriptions)} icon={BadgeCheck} tone="secondary" />
            <StatCard label="Abonnements expirés" value={String(subKpis.expiredSubscriptions)} icon={XCircle} tone="info" hint="publication bloquée" />
            <StatCard label="Expirent bientôt" value={String(subKpis.expiringSoon)} icon={Clock} tone="accent" hint="≤ 30 jours" />
            <StatCard label="Revenus abonnements" value={formatCurrencyCompact(subKpis.subscriptionRevenue)} icon={TrendingUp} tone="primary" hint="Consolidé en FCFA" />
            <StatCard label="Promotions actives" value={String(subKpis.activePromotions)} icon={Megaphone} tone="secondary" />
          </div>
        </div>
      )}

      {/* Publications par entreprise */}
      {subKpis && (
        <Card>
          <CardHeader><CardTitle>Publications par entreprise</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {[...subKpis.publicationsByCompany]
                .sort((a, b) => b.publications - a.publications)
                .map((row) => (
                  <div key={row.organizationId} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium text-foreground">{row.organizationName}</span>
                    <span className="text-sm text-muted">{row.publications} publication(s)</span>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires</CardTitle>
          </CardHeader>
          <CardBody>
            {revenue && <RevenueAreaChart data={revenue} formatter={formatCurrency} />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs par région</CardTitle>
          </CardHeader>
          <CardBody>
            {usersRegion && <HorizontalBarChart data={usersRegion} height={280} formatter={formatCompactNumber} />}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Billetterie</CardTitle>
          </CardHeader>
          <CardBody>
            {tickets && (
              <MultiLineChart
                data={tickets}
                series={[
                  { key: "sold", color: CHART_PALETTE[0] },
                  { key: "available", color: CHART_PALETTE[2] },
                  { key: "used", color: CHART_PALETTE[1] },
                ]}
              />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Événements</CardTitle>
          </CardHeader>
          <CardBody>
            {eventsBreak && (
              <GroupedBarChart
                data={eventsBreak}
                series={[
                  { key: "created", color: CHART_PALETTE[1] },
                  { key: "completed", color: CHART_PALETTE[4] },
                  { key: "cancelled", color: CHART_PALETTE[5] },
                  { key: "upcoming", color: CHART_PALETTE[3] },
                ]}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
