"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrganizationForm } from "@/features/organizations/OrganizationForm";
import { EmptyState } from "@/components/ui/States";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { organizationService } from "@/services";

export default function EditOrganizationPage({ params }: PageProps<"/organizations/[id]/edit">) {
  useRequireAuth(["SUPER_ADMIN"]);
  const { id } = use(params);

  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationService.get(id),
  });

  if (isLoading) return <div className="space-y-5"><SkeletonCards count={3} /></div>;
  if (!org) return <EmptyState title="Organisation introuvable" />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/organizations/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {org.name}
      </Link>
      <PageHeader title="Modifier l'entreprise" description="Mettez à jour les informations et le statut du compte." />
      <OrganizationForm mode="edit" organization={org} />
    </div>
  );
}
