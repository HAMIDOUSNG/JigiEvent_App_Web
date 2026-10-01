"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({ queryKey: ["categories"], queryFn: categoryService.all });

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  function openCreate() {
    setEditId(null);
    setName("");
    setDescription("");
    setModalOpen(true);
  }

  function openEdit(cat: { id: string; name: string; description: string }) {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description);
    setModalOpen(true);
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Nom requis", "Saisissez un nom de catégorie.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await categoryService.update(editId, { name, description });
        toast.success("Catégorie mise à jour", name);
      } else {
        await categoryService.create({ name, description });
        toast.success("Catégorie créée", name);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      toast.error("Échec", err instanceof Error ? err.message : "Opération impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(cat: { id: string; name: string }) {
    try {
      await categoryService.remove(cat.id);
      toast.success("Catégorie supprimée", cat.name);
      refresh();
    } catch (err) {
      toast.error("Suppression impossible", err instanceof Error ? err.message : "");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catégories"
        description="Secteurs d'activité des organisations."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouvelle catégorie</Button>}
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
                        { label: "Modifier", icon: Pencil, onClick: () => openEdit(cat) },
                        { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => remove(cat) },
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
        title={editId ? "Modifier la catégorie" : "Nouvelle catégorie"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={save} loading={saving}>{editId ? "Enregistrer" : "Créer"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nom" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Théâtre" />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de la catégorie" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
