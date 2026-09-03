"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Hotel,
  Utensils,
  Music,
  Disc,
  GraduationCap,
  Film,
  Landmark,
  Pencil,
  Trash2,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { categoryService } from "@/services";
import { formatNumber } from "@/utils/format";
import { toast } from "@/store/toast";
import { MoreHorizontal } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  hotel: Hotel,
  utensils: Utensils,
  music: Music,
  disc: Disc,
  "graduation-cap": GraduationCap,
  film: Film,
  landmark: Landmark,
};

export default function CategoriesPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: categories, isLoading } = useQuery({ queryKey: ["categories"], queryFn: categoryService.all });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catégories"
        description="Secteurs d'activité des organisations."
        action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle catégorie</Button>}
      />

      {isLoading ? (
        <SkeletonCards count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((cat) => {
            const Icon = ICONS[cat.icon] ?? Tags;
            return (
              <Card key={cat.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <Dropdown
                      trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
                      items={[
                        { label: "Modifier", icon: Pencil, onClick: () => toast.info("Modifier", cat.name) },
                        { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => toast.error("Supprimée", cat.name) },
                      ]}
                    />
                  </div>
                  <h3 className="text-h4 text-foreground mt-3">{cat.name}</h3>
                  <p className="text-body-sm text-muted mt-0.5">{cat.description}</p>
                  <div className="mt-4 flex gap-4 border-t border-border pt-3 text-caption">
                    <span><span className="font-semibold text-foreground">{formatNumber(cat.organizationsCount)}</span> orgs</span>
                    <span><span className="font-semibold text-foreground">{formatNumber(cat.eventsCount)}</span> événements</span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle catégorie"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={() => { toast.success("Catégorie créée"); setModalOpen(false); }}>Créer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nom" required><Input placeholder="Ex. Théâtre" /></Field>
          <Field label="Description"><Textarea placeholder="Description de la catégorie" /></Field>
        </div>
      </Modal>
    </div>
  );
}
