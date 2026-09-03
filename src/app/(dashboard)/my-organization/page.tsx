"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, CalendarDays, TrendingUp, Ticket, Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DetailList, DetailRow } from "@/components/ui/DetailList";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { organizationService, licenseService, dashboardService } from "@/services";
import { ENTITY_STATUS, LICENSE_STATUS } from "@/constants/status";
import { categories } from "@/mocks/data";
import { formatCurrency, formatCurrencyCompact, formatDate, daysUntil } from "@/utils/format";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";

export default function MyOrganizationPage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const orgId = user?.organizationId ?? "org-1";

  const { data: org, isLoading } = useQuery({ queryKey: ["organization", orgId], queryFn: () => organizationService.get(orgId) });
  const { data: licenses } = useQuery({ queryKey: ["licenses-all"], queryFn: () => licenseService.list({ pageSize: 100 }) });
  const { data: kpis } = useQuery({ queryKey: ["dash", "adm", orgId], queryFn: () => dashboardService.adminKpis(orgId) });
  const license = licenses?.data.find((l) => l.organizationId === orgId);

  if (isLoading) return <SkeletonCards count={3} />;
  if (!org) return <EmptyState title="Organisation introuvable" />;

  const catName = categories.find((c) => c.id === org.categoryId)?.name ?? org.categoryId;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mon organisation"
        description={`${catName} · ${org.city}, ${org.region}`}
        action={<Button variant="outline" onClick={() => toast.info("Modifier", "Édition de l'organisation")}><Pencil className="h-4 w-4" /> Modifier</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Événements" value={String(kpis?.myEvents ?? org.eventsCount)} icon={CalendarDays} tone="primary" />
        <StatCard label="Chiffre d'affaires" value={formatCurrencyCompact(kpis?.revenue ?? org.revenue)} icon={TrendingUp} tone="secondary" />
        <StatCard label="Billets vendus" value={String(kpis?.ticketsSold ?? 0)} icon={Ticket} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardBody>
            <DetailList>
              <DetailRow label="Nom" value={org.name} />
              <DetailRow label="Catégorie" value={catName} />
              <DetailRow label="Type" value={<Badge tone={org.type === "public" ? "info" : "neutral"} dot={false}>{org.type === "public" ? "Publique" : "Privée"}</Badge>} />
              <DetailRow label="Statut" value={<StatusBadge meta={ENTITY_STATUS[org.status]} />} />
              <DetailRow label="Adresse" value={<span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted" />{org.address}</span>} />
              <DetailRow label="Téléphone" value={<span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted" />{org.phone}</span>} />
              <DetailRow label="E-mail" value={<span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted" />{org.email}</span>} />
              <DetailRow label="Membre depuis" value={formatDate(org.createdAt)} />
            </DetailList>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Responsable</CardTitle></CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={org.adminName} size="md" />
                <div>
                  <p className="font-medium text-foreground">{org.adminName}</p>
                  <p className="text-caption">{org.email}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {license && (
            <Card>
              <CardHeader><CardTitle>Ma licence</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone="accent" dot={false}>{license.type}</Badge>
                  <StatusBadge meta={LICENSE_STATUS[license.status]} />
                </div>
                <DetailRow label="Échéance" value={formatDate(license.endDate)} />
                <DetailRow label="Jours restants" value={`${Math.max(0, daysUntil(license.endDate))} jours`} />
                <DetailRow label="Revenu associé" value={formatCurrency(license.revenue)} />
                <Button variant="outline" className="w-full" onClick={() => toast.info("Renouvellement", "Contactez le support")}>
                  Renouveler
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
