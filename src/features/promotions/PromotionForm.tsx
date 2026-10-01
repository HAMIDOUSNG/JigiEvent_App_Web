"use client";

import { useState } from "react";
import { Input, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast";
import { promotionService } from "@/services";

export function PromotionModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("10");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applicableEvents, setApplicableEvents] = useState("all");
  const [targetAudience, setTargetAudience] = useState("all");

  function reset() {
    setName(""); setCode(""); setDiscount("10");
    setStartDate(""); setEndDate("");
    setApplicableEvents("all"); setTargetAudience("all");
  }

  async function save() {
    if (!name.trim() || !code.trim()) {
      toast.error("Champs requis", "Le nom et le code promo sont obligatoires.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Dates requises", "Renseignez les dates de début et de fin.");
      return;
    }
    setSaving(true);
    try {
      await promotionService.create({
        name,
        code,
        discountPercent: Number(discount) || 0,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        applicableEvents,
        targetAudience,
        status: "scheduled",
      });
      toast.success("Promotion créée", name);
      reset();
      onClose();
      onCreated?.();
    } catch (err) {
      toast.error("Échec", err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
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
          <Field label="Nom" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Fête de l'Indépendance" />
          </Field>
          <Field label="Code promo" required>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="INDEP26" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Réduction (%)" required>
            <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>
          <Field label="Date de début" required>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Date de fin" required>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Événements applicables">
          <Select
            value={applicableEvents}
            onChange={(e) => setApplicableEvents(e.target.value)}
            options={[
              { value: "all", label: "Tous les événements" },
              { value: "concerts", label: "Concerts uniquement" },
              { value: "selected", label: "Sélection d'événements" },
            ]}
          />
        </Field>
        <Field label="Audience cible">
          <Select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            options={[
              { value: "all", label: "Tous les utilisateurs" },
              { value: "new", label: "Nouveaux utilisateurs" },
              { value: "region", label: "Région spécifique" },
              { value: "students", label: "Étudiants" },
            ]}
          />
        </Field>
      </div>
    </Modal>
  );
}
