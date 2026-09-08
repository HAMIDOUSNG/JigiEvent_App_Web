"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Input, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { subscriptionPromotionService } from "@/services";
import { toast } from "@/store/toast";
import type { SubscriptionPromotion } from "@/types";

const schema = z
  .object({
    name: z.string().min(2, "Nom requis."),
    period: z.enum(["daily", "monthly", "yearly"]),
    discountType: z.enum(["percent", "fixed"]),
    discountPercent: z.coerce.number().min(1).max(100).optional(),
    promoPrice: z.coerce.number().min(0).optional(),
    startDate: z.string().min(1, "Requis"),
    endDate: z.string().min(1, "Requis"),
    status: z.enum(["active", "scheduled", "ended", "draft"]),
  })
  .refine((v) => (v.discountType === "percent" ? v.discountPercent != null : true), {
    message: "Pourcentage requis.",
    path: ["discountPercent"],
  })
  .refine((v) => (v.discountType === "fixed" ? v.promoPrice != null : true), {
    message: "Prix promotionnel requis.",
    path: ["promoPrice"],
  })
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    message: "La date de fin doit suivre la date de début.",
    path: ["endDate"],
  });

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function SubscriptionPromotionModal({
  open,
  onClose,
  promotion,
}: {
  open: boolean;
  onClose: () => void;
  promotion?: SubscriptionPromotion | null;
}) {
  const qc = useQueryClient();
  const mode = promotion ? "edit" : "create";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      period: "monthly",
      discountType: "percent",
      discountPercent: 10,
      promoPrice: undefined,
      startDate: "",
      endDate: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: promotion?.name ?? "",
        period: promotion?.period ?? "monthly",
        discountType: promotion?.discountType ?? "percent",
        discountPercent: promotion?.discountPercent ?? 10,
        promoPrice: promotion?.promoPrice,
        startDate: toDateInput(promotion?.startDate),
        endDate: toDateInput(promotion?.endDate),
        status: promotion?.status ?? "scheduled",
      });
    }
  }, [open, promotion, reset]);

  const discountType = watch("discountType");

  async function onSubmit(values: FormOutput) {
    const payload = {
      name: values.name,
      period: values.period,
      discountType: values.discountType,
      discountPercent: values.discountPercent,
      promoPrice: values.promoPrice,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      status: values.status,
    };
    if (mode === "edit" && promotion) {
      await subscriptionPromotionService.update(promotion.id, payload);
      toast.success("Promotion mise à jour", values.name);
    } else {
      await subscriptionPromotionService.create(payload);
      toast.success("Promotion créée", values.name);
    }
    await qc.invalidateQueries({ queryKey: ["sub-promotions"] });
    await qc.invalidateQueries({ queryKey: ["plans"] });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Modifier la promotion" : "Créer une promotion"}
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
          <Field label="Nom de la promotion" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="Ex. Promo de Décembre" />
          </Field>
          <Field label="Abonnement concerné" required error={errors.period?.message}>
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
          <Field label="Type de réduction" required error={errors.discountType?.message}>
            <Select
              {...register("discountType")}
              options={[
                { value: "percent", label: "Pourcentage (%)" },
                { value: "fixed", label: "Prix promotionnel (FCFA)" },
              ]}
            />
          </Field>
          {discountType === "percent" ? (
            <Field label="Réduction (%)" required error={errors.discountPercent?.message}>
              <Input type="number" min={1} max={100} {...register("discountPercent")} />
            </Field>
          ) : (
            <Field label="Prix promotionnel (FCFA)" required error={errors.promoPrice?.message}>
              <Input type="number" step={1000} {...register("promoPrice")} />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date de début" required error={errors.startDate?.message}>
            <Input type="date" {...register("startDate")} />
          </Field>
          <Field label="Date de fin" required error={errors.endDate?.message}>
            <Input type="date" {...register("endDate")} />
          </Field>
          <Field label="Statut" required error={errors.status?.message}>
            <Select
              {...register("status")}
              options={[
                { value: "active", label: "Active" },
                { value: "scheduled", label: "Programmée" },
                { value: "ended", label: "Terminée" },
                { value: "draft", label: "Brouillon" },
              ]}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
