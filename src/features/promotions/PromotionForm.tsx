"use client";

import { useState } from "react";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast";

export function PromotionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success("Promotion créée");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer une promotion"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={save} loading={saving}>Créer</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" required><Input placeholder="Ex. Fête de l'Indépendance" /></Field>
          <Field label="Code promo" required><Input placeholder="INDEP26" /></Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Réduction (%)" required><Input type="number" defaultValue={10} /></Field>
          <Field label="Date de début" required><Input type="date" /></Field>
          <Field label="Date de fin" required><Input type="date" /></Field>
        </div>
        <Field label="Événements applicables">
          <Select
            options={[
              { value: "all", label: "Tous les événements" },
              { value: "concerts", label: "Concerts uniquement" },
              { value: "selected", label: "Sélection d'événements" },
            ]}
          />
        </Field>
        <Field label="Audience cible">
          <Select
            options={[
              { value: "all", label: "Tous les utilisateurs" },
              { value: "new", label: "Nouveaux utilisateurs" },
              { value: "region", label: "Région spécifique" },
              { value: "students", label: "Étudiants" },
            ]}
          />
        </Field>
        <Field label="Description"><Textarea placeholder="Détails de la promotion…" /></Field>
      </div>
    </Modal>
  );
}
