"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrganizationForm } from "@/features/organizations/OrganizationForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function CreateOrganizationPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/organizations" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Organisations
      </Link>
      <PageHeader
        title="Créer un compte entreprise"
        description="Créez directement un compte pour une entreprise et son espace Admin."
      />
      <OrganizationForm mode="create" />
    </div>
  );
}
