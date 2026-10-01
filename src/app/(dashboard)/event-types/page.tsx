"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const { data: types, isLoading } = useQuery({ queryKey: ["event-types"], queryFn: eventTypeService.all });

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["event-types"] });

  function openCreate() {
    setEditId(null); setName(""); setDescription(""); setModalOpen(true);
  }
  function openEdit(t: { id: string; name: string; description: string }) {
    setEditId(t.id); setName(t.name); setDescription(t.description); setModalOpen(true);
  }
  async function save() {
    if (!name.trim()) { toast.error("Nom requis", "Saisissez un nom."); return; }
    setSaving(true);
    try {
      if (editId) {
        await eventTypeService.update(editId, { name, description });
        toast.success("Type mis à jour", name);
      } else {
        await eventTypeService.create({ name, description });
        toast.success("Type créé", name);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      toast.error("Échec", err instanceof Error ? err.message : "Opération impossible.");
    } finally {
      setSaving(false);
    }
  }
  async function remove(t: { id: string; name: string }) {
    try {
      await eventTypeService.remove(t.id);
      toast.success("Type supprimé", t.name);
      refresh();
    } catch (err) {
      toast.error("Suppression impossible", err instanceof Error ? err.message : "");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Types d'événement"
        description="Catégorisez la nature des événements."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau type</Button>}
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
                      { label: "Modifier", icon: Pencil, onClick: () => openEdit(t) },
                      { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => remove(t) },
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
        title={editId ? "Modifier le type" : "Nouveau type d'événement"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={save} loading={saving}>{editId ? "Enregistrer" : "Créer"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nom" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Marathon" />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du type" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
