"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, MapPin, CalendarDays, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DetailList, DetailRow } from "@/components/ui/DetailList";
import { EmptyState } from "@/components/ui/States";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { organizationService, licenseService } from "@/services";
import { ENTITY_STATUS, LICENSE_STATUS } from "@/constants/status";
import { categories } from "@/mocks/data";
import { formatCurrency, formatCurrencyCompact, formatDate } from "@/utils/format";

export default function OrganizationDetailPage({ params }: PageProps<"/organizations/[id]">) {
  useRequireAuth(["SUPER_ADMIN"]);
  const { id } = use(params);

  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationService.get(id),
  });
  const { data: licenses } = useQuery({ queryKey: ["licenses-all"], queryFn: () => licenseService.list({ pageSize: 100 }) });
  const license = licenses?.data.find((l) => l.organizationId === id);

  if (isLoading) return <div className="space-y-5"><SkeletonCards count={3} /></div>;
  if (!org) return <EmptyState title="Organisation introuvable" />;

  const catName = categories.find((c) => c.id === org.categoryId)?.name ?? org.categoryId;

  return (
    <div className="space-y-5">
      <Link href="/organizations" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Organisations
      </Link>

      <PageHeader
        title={org.name}
        description={`${catName} · ${org.city}, ${org.region}`}
        action={<Button variant="outline">Modifier</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Événements" value={String(org.eventsCount)} icon={CalendarDays} tone="primary" />
        <StatCard label="Chiffre d'affaires" value={formatCurrencyCompact(org.revenue)} icon={TrendingUp} tone="secondary" />
        <StatCard label="Statut licence" value={license?.type ?? "—"} icon={CalendarDays} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardBody>
            <DetailList>
              <DetailRow label="Nom" value={org.name} />
              <DetailRow label="Catégorie" value={catName} />
              <DetailRow
                label="Type"
                value={<Badge tone={org.type === "public" ? "info" : "neutral"} dot={false}>{org.type === "public" ? "Publique" : "Privée"}</Badge>}
              />
              <DetailRow label="Statut" value={<StatusBadge meta={ENTITY_STATUS[org.status]} />} />
              <DetailRow label="Région" value={`${org.city}, ${org.region}`} />
              <DetailRow label="Adresse" value={<span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted" />{org.address}</span>} />
              <DetailRow label="Téléphone" value={<span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted" />{org.phone}</span>} />
              <DetailRow label="E-mail" value={<span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted" />{org.email}</span>} />
              <DetailRow label="Créée le" value={formatDate(org.createdAt)} />
            </DetailList>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Administrateur</CardTitle></CardHeader>
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
              <CardHeader><CardTitle>Licence</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone="accent" dot={false}>{license.type}</Badge>
                  <StatusBadge meta={LICENSE_STATUS[license.status]} />
                </div>
                <DetailRow label="Fin de licence" value={formatDate(license.endDate)} />
                <DetailRow label="Revenu associé" value={formatCurrency(license.revenue)} />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
