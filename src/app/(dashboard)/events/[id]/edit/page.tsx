"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventForm } from "@/features/events/EventForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function EditEventPage({ params }: PageProps<"/events/[id]/edit">) {
  useRequireAuth();
  const { id } = use(params);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Détails de l&apos;événement
      </Link>
      <PageHeader title="Modifier l'événement" description="Mettez à jour les informations." />
      <EventForm mode="edit" />
    </div>
  );
}
