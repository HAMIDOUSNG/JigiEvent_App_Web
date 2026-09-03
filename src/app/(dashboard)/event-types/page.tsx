"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, MoreHorizontal, Layers } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { eventTypeService } from "@/services";
import { formatNumber } from "@/utils/format";
import { toast } from "@/store/toast";

export default function EventTypesPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: types, isLoading } = useQuery({ queryKey: ["event-types"], queryFn: eventTypeService.all });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Types d'événement"
        description="Catégorisez la nature des événements."
        action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouveau type</Button>}
      />

      {isLoading ? (
        <SkeletonCards count={8} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {types?.map((t) => (
            <Card key={t.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-secondary-50 text-secondary">
                    <Layers className="h-5 w-5" />
                  </span>
                  <Dropdown
                    trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
                    items={[
                      { label: "Modifier", icon: Pencil, onClick: () => toast.info("Modifier", t.name) },
                      { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => toast.error("Supprimé", t.name) },
                    ]}
                  />
                </div>
                <h3 className="text-h4 text-foreground mt-3">{t.name}</h3>
                <p className="text-caption mt-1">{formatNumber(t.eventsCount)} événements</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouveau type d'événement"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={() => { toast.success("Type créé"); setModalOpen(false); }}>Créer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nom" required><Input placeholder="Ex. Marathon" /></Field>
          <Field label="Description"><Textarea placeholder="Description du type" /></Field>
        </div>
      </Modal>
    </div>
  );
}
