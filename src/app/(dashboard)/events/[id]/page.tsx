"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Ticket,
  TrendingUp,
  ShoppingCart,
  Pencil,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { eventService } from "@/services";
import { EVENT_STATUS, ORDER_STATUS, TICKET_STATUS } from "@/constants/status";
import { categories, eventTypes } from "@/mocks/data";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateTime,
  formatNumber,
  timeAgo,
} from "@/utils/format";

export default function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  useRequireAuth();
  const router = useRouter();
  const { id } = use(params);

  const { data: evt, isLoading } = useQuery({ queryKey: ["event", id], queryFn: () => eventService.get(id) });
  const { data: tickets } = useQuery({ queryKey: ["event-tickets", id], queryFn: () => eventService.ticketsFor(id) });
  const { data: recentOrders } = useQuery({ queryKey: ["event-orders", id], queryFn: () => eventService.ordersFor(id) });

  if (isLoading) return <SkeletonCards count={4} />;
  if (!evt) return <EmptyState title="Événement introuvable" />;

  const remaining = evt.ticketsTotal - evt.ticketsSold;
  const catName = categories.find((c) => c.id === evt.categoryId)?.name ?? evt.categoryId;
  const typeName = eventTypes.find((t) => t.id === evt.eventTypeId)?.name ?? evt.eventTypeId;

  return (
    <div className="space-y-5">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Événements
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="pattern-mudcloth relative h-40">
          <div className="absolute inset-0 bg-gradient-to-t from-[#143528]/70 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge meta={EVENT_STATUS[evt.status]} />
                <Badge tone="accent" dot={false}>{catName}</Badge>
              </div>
              <h1 className="font-display text-2xl font-bold text-[#F7F3EC] mt-2">{evt.name}</h1>
              <p className="text-sm text-[#F7F3EC]/80">{evt.organizationName}</p>
            </div>
            <Button variant="accent" onClick={() => router.push(`/events/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Modifier
            </Button>
          </div>
        </div>
        <CardBody className="flex flex-wrap gap-x-8 gap-y-3">
          <span className="inline-flex items-center gap-2 text-sm text-foreground-soft"><CalendarDays className="h-4 w-4 text-muted" />{formatDateTime(evt.startDate)}</span>
          <span className="inline-flex items-center gap-2 text-sm text-foreground-soft"><MapPin className="h-4 w-4 text-muted" />{evt.address}</span>
          <span className="inline-flex items-center gap-2 text-sm text-foreground-soft"><Tag className="h-4 w-4 text-muted" />{typeName}</span>
        </CardBody>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Billets vendus" value={formatNumber(evt.ticketsSold)} icon={Ticket} tone="primary" />
        <StatCard label="Billets restants" value={formatNumber(remaining)} icon={Ticket} tone="accent" />
        <StatCard label="Revenu" value={formatCurrencyCompact(evt.revenue)} icon={TrendingUp} tone="secondary" />
        <StatCard label="Commandes" value={formatNumber(evt.ordersCount)} icon={ShoppingCart} tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Ticket types */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Types de billets</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {tickets?.map((t) => {
              const pct = t.quantity ? Math.round((t.sold / t.quantity) * 100) : 0;
              return (
                <div key={t.id} className="rounded-[var(--radius-md)] border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{t.name}</span>
                      <StatusBadge meta={TICKET_STATUS[t.status]} />
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(t.price)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-caption">
                    <span>{formatNumber(t.sold)} vendus · {formatNumber(t.quantity - t.sold)} restants</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader><CardTitle>Activité</CardTitle></CardHeader>
          <CardBody>
            <ul className="space-y-4">
              {[
                { label: "Événement publié", time: evt.createdAt },
                { label: `${evt.ordersCount} commandes reçues`, time: evt.startDate },
                { label: `${formatNumber(evt.ticketsSold)} billets vendus`, time: evt.startDate },
              ].map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm text-foreground">{a.label}</p>
                    <p className="text-caption">{timeAgo(a.time)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader
          action={<Link href="/orders" className="text-sm font-medium text-primary hover:underline">Tout voir</Link>}
        >
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full">
            <tbody className="divide-y divide-border">
              {recentOrders?.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => router.push(`/orders/${o.id}`)}>
                  <td className="px-5 py-3 text-body-sm font-medium text-foreground">{o.reference}</td>
                  <td className="px-5 py-3 text-body-sm text-foreground-soft">{o.customerName}</td>
                  <td className="px-5 py-3 text-body-sm text-muted">{o.ticketsCount} billet(s)</td>
                  <td className="px-5 py-3 text-body-sm font-medium text-right">{formatCurrency(o.amount)}</td>
                  <td className="px-5 py-3 text-right"><StatusBadge meta={ORDER_STATUS[o.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
