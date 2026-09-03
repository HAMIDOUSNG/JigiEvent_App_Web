"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ImagePlus, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { categories, eventTypes, REGIONS } from "@/mocks/data";
import { PAYMENT_METHOD_LABEL } from "@/constants/status";
import { toast } from "@/store/toast";
import { formatCurrency } from "@/utils/format";

const ticketSchema = z.object({
  name: z.string().min(1, "Requis"),
  price: z.coerce.number().min(0, "≥ 0"),
  quantity: z.coerce.number().min(1, "≥ 1"),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  categoryId: z.string().min(1, "Sélectionnez une catégorie."),
  eventTypeId: z.string().min(1, "Sélectionnez un type."),
  description: z.string().min(10, "Décrivez l'événement (10 caractères min)."),
  startDate: z.string().min(1, "Requis"),
  startTime: z.string().min(1, "Requis"),
  endDate: z.string().min(1, "Requis"),
  endTime: z.string().min(1, "Requis"),
  region: z.string().min(1, "Requis"),
  city: z.string().min(1, "Requis"),
  address: z.string().min(1, "Requis"),
  paymentMethods: z.array(z.string()).min(1, "Sélectionnez au moins un moyen de paiement."),
  tickets: z.array(ticketSchema).min(1, "Ajoutez au moins un type de billet."),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const PAYMENT_OPTIONS = Object.entries(PAYMENT_METHOD_LABEL);

export function EventForm({ mode = "create" }: { mode?: "create" | "edit" }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      categoryId: "",
      eventTypeId: "",
      description: "",
      startDate: "",
      startTime: "19:00",
      endDate: "",
      endTime: "23:00",
      region: "",
      city: "",
      address: "",
      paymentMethods: ["orange_money", "moov_money"],
      tickets: [{ name: "Standard", price: 12000, quantity: 500, saleStart: "", saleEnd: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "tickets" });
  const paymentMethods = watch("paymentMethods");
  const tickets = watch("tickets");

  function togglePayment(method: string) {
    const set = new Set(paymentMethods);
    if (set.has(method)) set.delete(method);
    else set.add(method);
    setValue("paymentMethods", Array.from(set), { shouldValidate: true });
  }

  async function onSubmit(action: "draft" | "publish") {
    return handleSubmit(async () => {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 900));
      setSubmitting(false);
      toast.success(
        action === "publish" ? "Événement publié" : "Brouillon enregistré",
        action === "publish" ? "Il est maintenant visible." : "Vous pourrez le publier plus tard."
      );
      router.push("/events");
    })();
  }

  const totalCapacity = tickets?.reduce((s, t) => s + (Number(t.quantity) || 0), 0) ?? 0;
  const potential = tickets?.reduce((s, t) => s + (Number(t.price) || 0) * (Number(t.quantity) || 0), 0) ?? 0;

  return (
    <form className="space-y-5">
      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Informations de base</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Nom de l'événement" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="Ex. Afrobeat Festival 2026" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie" required error={errors.categoryId?.message}>
              <Select
                {...register("categoryId")}
                options={[{ value: "", label: "Sélectionner…" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </Field>
            <Field label="Type d'événement" required error={errors.eventTypeId?.message}>
              <Select
                {...register("eventTypeId")}
                options={[{ value: "", label: "Sélectionner…" }, ...eventTypes.map((t) => ({ value: t.id, label: t.name }))]}
              />
            </Field>
          </div>
          <Field label="Description" required error={errors.description?.message}>
            <Textarea {...register("description")} placeholder="Décrivez votre événement…" />
          </Field>
        </CardBody>
      </Card>

      {/* Date & time */}
      <Card>
        <CardHeader><CardTitle>Date & heure</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Date de début" required error={errors.startDate?.message}>
            <Input type="date" {...register("startDate")} />
          </Field>
          <Field label="Heure de début" required error={errors.startTime?.message}>
            <Input type="time" {...register("startTime")} />
          </Field>
          <Field label="Date de fin" required error={errors.endDate?.message}>
            <Input type="date" {...register("endDate")} />
          </Field>
          <Field label="Heure de fin" required error={errors.endTime?.message}>
            <Input type="time" {...register("endTime")} />
          </Field>
        </CardBody>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader><CardTitle>Lieu</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Région" required error={errors.region?.message}>
              <Select
                {...register("region")}
                options={[{ value: "", label: "Sélectionner…" }, ...REGIONS.map((r) => ({ value: r, label: r }))]}
              />
            </Field>
            <Field label="Ville" required error={errors.city?.message}>
              <Input {...register("city")} placeholder="Ex. Bamako" />
            </Field>
          </div>
          <Field label="Adresse" required error={errors.address?.message}>
            <Input {...register("address")} icon={<MapPin className="h-4 w-4" />} placeholder="Adresse du lieu" />
          </Field>
          <div className="flex h-32 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface-2 text-caption">
            Carte (localisation) — intégration à venir
          </div>
        </CardBody>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader><CardTitle>Médias</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["Image de couverture", "Galerie", "Vidéos"].map((label) => (
              <button
                key={label}
                type="button"
                className="flex h-32 flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface-2 text-muted transition-colors hover:border-primary hover:text-primary"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", price: 0, quantity: 100, saleStart: "", saleEnd: "" })}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          }
        >
          <CardTitle>Billets</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {errors.tickets?.message && <p className="text-xs text-error">{errors.tickets.message}</p>}
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-2 items-end gap-3 rounded-[var(--radius-md)] border border-border bg-surface-2 p-3 sm:grid-cols-5">
              <Field label="Type" error={errors.tickets?.[i]?.name?.message}>
                <Input {...register(`tickets.${i}.name`)} placeholder="VIP" />
              </Field>
              <Field label="Prix (FCFA)" error={errors.tickets?.[i]?.price?.message}>
                <Input type="number" {...register(`tickets.${i}.price`)} />
              </Field>
              <Field label="Quantité" error={errors.tickets?.[i]?.quantity?.message}>
                <Input type="number" {...register(`tickets.${i}.quantity`)} />
              </Field>
              <Field label="Début vente">
                <Input type="date" {...register(`tickets.${i}.saleStart`)} />
              </Field>
              <div className="flex items-end gap-2">
                <Field label="Fin vente" className="flex-1">
                  <Input type="date" {...register(`tickets.${i}.saleEnd`)} />
                </Field>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Supprimer">
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-6 border-t border-border pt-3 text-sm">
            <span className="text-muted">Capacité totale : <span className="font-semibold text-foreground">{totalCapacity}</span></span>
            <span className="text-muted">Revenu potentiel : <span className="font-semibold text-foreground">{formatCurrency(potential)}</span></span>
          </div>
        </CardBody>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader><CardTitle>Moyens de paiement</CardTitle></CardHeader>
        <CardBody>
          {errors.paymentMethods?.message && <p className="mb-2 text-xs text-error">{errors.paymentMethods.message}</p>}
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map(([value, label]) => {
              const active = paymentMethods?.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePayment(value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-primary bg-primary-50 text-primary-700" : "border-border-strong text-foreground-soft hover:bg-sand"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Publishing */}
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button type="button" variant="outline" onClick={() => router.push("/events")}>
          Annuler
        </Button>
        <Button type="button" variant="ghost" onClick={() => onSubmit("draft")} loading={submitting}>
          Enregistrer en brouillon
        </Button>
        <Button type="button" onClick={() => onSubmit("publish")} loading={submitting}>
          {mode === "edit" ? "Enregistrer" : "Publier l'événement"}
        </Button>
      </div>
    </form>
  );
}
