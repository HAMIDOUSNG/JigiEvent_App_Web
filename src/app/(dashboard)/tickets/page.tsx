"use client";

import { useQuery } from "@tanstack/react-query";
import { Ticket as TicketIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ticketService } from "@/services";
import { TICKET_STATUS } from "@/constants/status";
import { events } from "@/mocks/data";
import { formatCurrency, formatNumber } from "@/utils/format";
import { useAuthStore } from "@/store/auth";

const eventName = (id: string) => events.find((e) => e.id === id)?.name ?? id;
const eventOrg = (id: string) => events.find((e) => e.id === id)?.organizationId;

export default function TicketsPage() {
  useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const isSA = user?.role === "SUPER_ADMIN";
  const { data: allTickets, isLoading } = useQuery({ queryKey: ["tickets-all"], queryFn: ticketService.all });

  const tickets = (allTickets ?? []).filter(
    (t) => isSA || !user?.organizationId || eventOrg(t.eventId) === user.organizationId
  );

  const totalSold = tickets.reduce((s, t) => s + t.sold, 0);
  const totalCapacity = tickets.reduce((s, t) => s + t.quantity, 0);
  const revenue = tickets.reduce((s, t) => s + t.sold * t.price, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Billets" description="Types de billets et suivi des stocks." />

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Billets vendus" value={formatNumber(totalSold)} icon={TicketIcon} tone="primary" />
          <StatCard label="Capacité totale" value={formatNumber(totalCapacity)} icon={TicketIcon} tone="accent" />
          <StatCard label="Revenu billetterie" value={formatCurrency(revenue)} icon={TicketIcon} tone="secondary" />
        </div>
      )}

      {isLoading ? (
        <SkeletonCards count={6} />
      ) : tickets.length === 0 ? (
        <Card><EmptyState icon={TicketIcon} title="Aucun billet" description="Créez un événement avec des billets." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => {
            const remaining = t.quantity - t.sold;
            const pct = t.quantity ? Math.round((t.sold / t.quantity) * 100) : 0;
            return (
              <Card key={t.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-caption">{eventName(t.eventId)}</p>
                      <h3 className="text-h4 text-foreground mt-0.5">{t.name}</h3>
                    </div>
                    <StatusBadge meta={TICKET_STATUS[t.status]} />
                  </div>
                  <p className="mt-3 text-h3 font-display text-primary">{formatCurrency(t.price)}</p>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-caption">
                      <span>{formatNumber(t.sold)} vendus / {formatNumber(t.quantity)}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-sand">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-caption">{formatNumber(remaining)} restants</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
