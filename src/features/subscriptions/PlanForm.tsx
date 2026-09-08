"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { planService } from "@/services";
import { toast } from "@/store/toast";
import type { SubscriptionPlan } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Nom requis."),
  period: z.enum(["daily", "monthly", "yearly"]),
  price: z.coerce.number().min(0, "Le prix doit être ≥ 0."),
  description: z.string().optional(),
  features: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function PlanModal({
  open,
  onClose,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan | null;
}) {
  const qc = useQueryClient();
  const mode = plan ? "edit" : "create";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      period: "monthly",
      price: 0,
      description: "",
      features: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: plan?.name ?? "",
        period: plan?.period ?? "monthly",
        price: plan?.price ?? 0,
        description: plan?.description ?? "",
        features: plan?.features?.join("\n") ?? "",
        status: plan?.status ?? "active",
      });
    }
  }, [open, plan, reset]);

  async function onSubmit(values: FormOutput) {
    const payload = {
      name: values.name,
      period: values.period,
      price: values.price,
      description: values.description ?? "",
      features: (values.features ?? "").split("\n").map((f) => f.trim()).filter(Boolean),
      status: values.status,
    };
    if (mode === "edit" && plan) {
      await planService.update(plan.id, payload);
      toast.success("Plan mis à jour", values.name);
    } else {
      await planService.create(payload);
      toast.success("Plan créé", values.name);
    }
    await qc.invalidateQueries({ queryKey: ["plans"] });
    await qc.invalidateQueries({ queryKey: ["plans-active"] });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Modifier le plan" : "Créer un plan d'abonnement"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {mode === "edit" ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom du plan" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="Ex. Mensuel" />
          </Field>
          <Field label="Périodicité" required error={errors.period?.message}>
            <Select
              {...register("period")}
              options={[
                { value: "daily", label: "Journalier" },
                { value: "monthly", label: "Mensuel" },
                { value: "yearly", label: "Annuel" },
              ]}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prix (FCFA)" required error={errors.price?.message} hint="Entièrement configurable.">
            <Input type="number" step={1000} {...register("price")} />
          </Field>
          <Field label="Statut" required error={errors.status?.message}>
            <Select
              {...register("status")}
              options={[
                { value: "active", label: "Actif" },
                { value: "inactive", label: "Inactif" },
              ]}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea {...register("description")} placeholder="Décrivez ce que couvre ce plan…" />
        </Field>
        <Field label="Avantages (une ligne par avantage)">
          <Textarea {...register("features")} placeholder={"Publications illimitées\nAjout de médias\nPublication d'événements"} />
        </Field>
      </div>
    </Modal>
  );
}
