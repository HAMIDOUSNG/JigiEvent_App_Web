"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import {
  RevenueAreaChart,
  MultiLineChart,
  GroupedBarChart,
  HorizontalBarChart,
  DonutChart,
  CHART_PALETTE,
} from "@/components/charts";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { analyticsService, dashboardService } from "@/services";
import { formatCurrency, formatCompactNumber } from "@/utils/format";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-h3 font-display text-foreground">{title}</h2>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  useRequireAuth(["SUPER_ADMIN"]);

  const { data: kpis } = useQuery({ queryKey: ["dash", "sa"], queryFn: dashboardService.superAdminKpis });
  const { data: revenue } = useQuery({ queryKey: ["an", "revenue"], queryFn: analyticsService.revenueOverTime });
  const { data: tickets } = useQuery({ queryKey: ["an", "tickets"], queryFn: analyticsService.ticketsOverTime });
  const { data: eventsBreak } = useQuery({ queryKey: ["an", "events"], queryFn: analyticsService.eventsBreakdown });
  const { data: usersRegion } = useQuery({ queryKey: ["an", "usersRegion"], queryFn: analyticsService.usersByRegion });
  const { data: byCategory } = useQuery({ queryKey: ["an", "byCategory"], queryFn: analyticsService.revenueByCategory });
  const { data: topOrgs } = useQuery({ queryKey: ["an", "topOrgs"], queryFn: analyticsService.topOrganizations });
  const { data: topEvents } = useQuery({ queryKey: ["an", "topEvents"], queryFn: analyticsService.topEvents });
  const { data: ticketDist } = useQuery({ queryKey: ["an", "ticketDist"], queryFn: analyticsService.ticketDistribution });

  return (
    <div className="space-y-8">
      <PageHeader title="Analytique" description="Vue analytique complète de la plateforme." />

      {/* Users */}
      <Section title="Utilisateurs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Nouveaux utilisateurs" value={formatCompactNumber(1240)} icon={Users} tone="primary" trend={{ value: 12.4, positive: true }} />
          <StatCard label="Utilisateurs actifs" value={formatCompactNumber(kpis?.totalUsers ?? 0)} icon={UserCheck} tone="secondary" trend={{ value: 6.8, positive: true }} />
          <StatCard label="Régions couvertes" value="8" icon={Users} tone="accent" />
        </div>
        <Card>
          <CardHeader><CardTitle>Utilisateurs par région</CardTitle></CardHeader>
          <CardBody>{usersRegion && <HorizontalBarChart data={usersRegion} formatter={formatCompactNumber} height={280} />}</CardBody>
        </Card>
      </Section>

      {/* Events */}
      <Section title="Événements">
        <Card>
          <CardHeader><CardTitle>Créés · terminés · annulés · à venir</CardTitle></CardHeader>
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
                height={280}
              />
            )}
          </CardBody>
        </Card>
      </Section>

      {/* Tickets */}
      <Section title="Billets">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Vendus · disponibles · utilisés</CardTitle></CardHeader>
            <CardBody>
              {tickets && (
                <MultiLineChart
                  data={tickets}
                  series={[
                    { key: "sold", color: CHART_PALETTE[0] },
                    { key: "available", color: CHART_PALETTE[2] },
                    { key: "used", color: CHART_PALETTE[1] },
                  ]}
                  height={280}
                />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Répartition</CardTitle></CardHeader>
            <CardBody>{ticketDist && <DonutChart data={ticketDist} formatter={(v) => `${v}%`} height={280} />}</CardBody>
          </Card>
        </div>
      </Section>

      {/* Revenue */}
      <Section title="Chiffre d'affaires">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Revenu brut" value={formatCurrency(kpis?.totalRevenue ?? 0)} icon={TrendingUp} tone="primary" />
          <StatCard label="Commission" value={formatCurrency(kpis?.commission ?? 0)} icon={TrendingUp} tone="secondary" />
          <StatCard label="Revenu net" value={formatCurrency((kpis?.totalRevenue ?? 0) - (kpis?.commission ?? 0))} icon={TrendingUp} tone="accent" />
        </div>
        <Card>
          <CardHeader><CardTitle>Évolution du revenu</CardTitle></CardHeader>
          <CardBody>{revenue && <RevenueAreaChart data={revenue} formatter={formatCurrency} height={280} />}</CardBody>
        </Card>
      </Section>

      {/* Organizations */}
      <Section title="Organisations">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Top organisations</CardTitle></CardHeader>
            <CardBody>{topOrgs && <HorizontalBarChart data={topOrgs} formatter={formatCurrency} height={260} />}</CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top événements</CardTitle></CardHeader>
            <CardBody>{topEvents && <HorizontalBarChart data={topEvents} formatter={formatCurrency} height={260} />}</CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top catégories</CardTitle></CardHeader>
            <CardBody>{byCategory && <DonutChart data={byCategory} formatter={formatCurrency} height={260} />}</CardBody>
          </Card>
        </div>
      </Section>
    </div>
  );
}
