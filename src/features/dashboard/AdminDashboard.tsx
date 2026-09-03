"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Ticket, TrendingUp, ShoppingCart, Clock, Layers } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { RevenueAreaChart, MultiLineChart, DonutChart, CHART_PALETTE } from "@/components/charts";
import { dashboardService, analyticsService } from "@/services";
import { formatCurrencyCompact, formatCompactNumber, formatCurrency } from "@/utils/format";
import { useI18n } from "@/i18n/I18nProvider";

export function AdminDashboard({ orgId }: { orgId: string }) {
  const { t } = useI18n();
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["dashboard", "admin", orgId],
    queryFn: () => dashboardService.adminKpis(orgId),
  });
  const { data: revenue } = useQuery({ queryKey: ["an", "revenue"], queryFn: analyticsService.revenueOverTime });
  const { data: tickets } = useQuery({ queryKey: ["an", "tickets"], queryFn: analyticsService.ticketsOverTime });
  const { data: ticketDist } = useQuery({ queryKey: ["an", "ticketDist"], queryFn: analyticsService.ticketDistribution });

  return (
    <div className="space-y-6">
      {isLoading || !kpis ? (
        <SkeletonCards count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label={t("kpi.myEvents")} value={String(kpis.myEvents)} icon={CalendarDays} tone="primary" trend={{ value: 6.2, positive: true }} />
          <StatCard label={t("kpi.ticketsSold")} value={formatCompactNumber(kpis.ticketsSold)} icon={Ticket} tone="info" trend={{ value: 11.9, positive: true }} />
          <StatCard label={t("kpi.totalRevenue")} value={formatCurrencyCompact(kpis.revenue)} icon={TrendingUp} tone="secondary" trend={{ value: 8.4, positive: true }} />
          <StatCard label={t("kpi.pendingOrders")} value={String(kpis.pendingOrders)} icon={ShoppingCart} tone="accent" hint="à traiter" />
          <StatCard label={t("kpi.upcomingEvents")} value={String(kpis.upcomingEvents)} icon={Clock} tone="info" />
          <StatCard label={t("kpi.ticketsAvailable")} value={formatCompactNumber(kpis.ticketsAvailable)} icon={Layers} tone="primary" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ventes & chiffre d&apos;affaires</CardTitle>
          </CardHeader>
          <CardBody>{revenue && <RevenueAreaChart data={revenue} color={CHART_PALETTE[1]} formatter={formatCurrency} />}</CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Répartition des billets</CardTitle>
          </CardHeader>
          <CardBody>{ticketDist && <DonutChart data={ticketDist} formatter={(v) => `${v}%`} />}</CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance des événements</CardTitle>
        </CardHeader>
        <CardBody>
          {tickets && (
            <MultiLineChart
              data={tickets}
              series={[
                { key: "sold", color: CHART_PALETTE[0] },
                { key: "used", color: CHART_PALETTE[1] },
              ]}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
