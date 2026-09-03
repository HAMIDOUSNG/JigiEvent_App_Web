"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventForm } from "@/features/events/EventForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function CreateEventPage() {
  useRequireAuth();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Événements
      </Link>
      <PageHeader title="Créer un événement" description="Renseignez les informations de votre événement." />
      <EventForm mode="create" />
    </div>
  );
}
