"use client";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ImagePlus, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { eventTypes, REGIONS } from "@/mocks/data";
import { PAYMENT_METHOD_LABEL } from "@/constants/status";
import { toast } from "@/store/toast";
import { formatCurrency } from "@/utils/format";
import { eventService, organizationService, mediaService, type EventDbStatus } from "@/services";
import { useAuthStore } from "@/store/auth";

/** Combine une date (YYYY-MM-DD) et une heure (HH:mm) en ISO string. */
function toISO(date: string, time: string): string {
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const d = new Date(`${date}T${t}:00`);
  return isNaN(d.getTime()) ? new Date(date).toISOString() : d.toISOString();
}

/** Découpe une date ISO en { date: YYYY-MM-DD, time: HH:mm } pour les inputs. */
function fromISO(iso: string | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const ticketSchema = z.object({
  // id présent = billet existant (édition) ; absent/"" = nouveau billet.
  id: z.string().optional(),
  name: z.string().min(1, "Requis"),
  price: z.coerce.number().min(0, "≥ 0"),
  quantity: z.coerce.number().min(1, "≥ 1"),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  organizationId: z.string().min(1, "Sélectionnez une organisation."),
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

export function EventForm({ mode = "create", eventId }: { mode?: "create" | "edit"; eventId?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSA = user?.role === "SUPER_ADMIN";
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  // Image de couverture : URL (Supabase Storage en mode réel, data URL en mock).
  const [coverImage, setCoverImage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  // Catégories réelles (Supabase en mode réel, mock sinon).
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([]);
  // Organisations : nécessaire pour le Super Admin (choix de l'organisateur).
  const [orgOptions, setOrgOptions] = useState<{ id: string; name: string }[]>([]);
  // Ids des billets chargés initialement (pour détecter les suppressions au submit).
  const [initialTicketIds, setInitialTicketIds] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      organizationId: !isSA && user?.organizationId ? user.organizationId : "",
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
      tickets: [{ id: "", name: "Standard", price: 12000, quantity: 500, saleStart: "", saleEnd: "" }],
    },
  });

  // Charge les catégories et (pour le SA) les organisations.
  useEffect(() => {
    let active = true;
    eventService.categories().then((cats) => {
      if (active) setCategoryOptions(cats);
    }).catch(() => {});
    if (isSA) {
      organizationService.list({ pageSize: 100 }).then((res) => {
        if (active) setOrgOptions(res.data.map((o) => ({ id: o.id, name: o.name })));
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [isSA]);

  // En mode édition : précharge l'événement existant + ses types de billets.
  useEffect(() => {
    if (mode !== "edit" || !eventId) return;
    let active = true;
    (async () => {
      try {
        const [event, ticketTypes] = await Promise.all([
          eventService.get(eventId),
          eventService.ticketsFor(eventId),
        ]);
        if (!active || !event) return;
        const start = fromISO(event.startDate);
        const end = fromISO(event.endDate);
        setCoverImage(event.coverImage || "");
        setInitialTicketIds(ticketTypes.map((t) => t.id));
        reset({
          name: event.name,
          organizationId: event.organizationId,
          categoryId: event.categoryId,
          eventTypeId: event.eventTypeId || "",
          description: event.description,
          startDate: start.date,
          startTime: start.time || "19:00",
          endDate: end.date,
          endTime: end.time || "23:00",
          region: event.region,
          city: event.city,
          address: event.address,
          paymentMethods: ["orange_money", "moov_money"],
          tickets:
            ticketTypes.length > 0
              ? ticketTypes.map((t) => ({
                  id: t.id,
                  name: t.name,
                  price: t.price,
                  quantity: t.quantity,
                  saleStart: "",
                  saleEnd: "",
                }))
              : [{ id: "", name: "Standard", price: 12000, quantity: 500, saleStart: "", saleEnd: "" }],
        });
      } catch {
        if (active) toast.error("Chargement impossible", "Impossible de charger l'événement.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [mode, eventId, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "tickets" });
  const paymentMethods = watch("paymentMethods");
  const tickets = watch("tickets");

  async function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Réinitialise l'input pour permettre de re-sélectionner le même fichier.
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier invalide", "Veuillez sélectionner une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde", "Taille maximale : 5 Mo.");
      return;
    }
    setUploadingCover(true);
    try {
      const url = await mediaService.uploadImage(file, "covers");
      setCoverImage(url);
      toast.success("Image téléversée", "L'image de couverture a été ajoutée.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Téléversement impossible.";
      toast.error("Échec du téléversement", message);
    } finally {
      setUploadingCover(false);
    }
  }

  function togglePayment(method: string) {
    const set = new Set(paymentMethods);
    if (set.has(method)) set.delete(method);
    else set.add(method);
    setValue("paymentMethods", Array.from(set), { shouldValidate: true });
  }

  async function onSubmit(action: "draft" | "publish") {
    return handleSubmit(async (values) => {
      setSubmitting(true);
      try {
        // draft => non publié ; publish => "upcoming" (visible côté mobile).
        const status: EventDbStatus = action === "publish" ? "upcoming" : "draft";
        const payload = {
          name: values.name,
          description: values.description,
          organizationId: values.organizationId,
          categoryId: values.categoryId,
          region: values.region,
          city: values.city,
          address: values.address,
          venueName: values.address,
          startDate: toISO(values.startDate, values.startTime),
          endDate: toISO(values.endDate, values.endTime),
          coverImage,
          status,
        };

        if (mode === "edit" && eventId) {
          // Mise à jour de l'événement existant.
          await eventService.update(eventId, payload);

          // --- Diff des types de billets ---
          // Lignes actuelles avec un id => existantes (à mettre à jour) ;
          // sans id => nouvelles (à créer). Ids initiaux absents des lignes
          // actuelles => supprimés.
          const currentIds = values.tickets
            .map((t) => t.id)
            .filter((id): id is string => Boolean(id));
          const toRemove = initialTicketIds.filter((id) => !currentIds.includes(id));

          const [, , ...removeResults] = await Promise.all([
            // Créations
            Promise.all(
              values.tickets
                .filter((t) => !t.id)
                .map((t) =>
                  eventService.addTicketType(eventId, {
                    name: t.name,
                    price: Number(t.price),
                    quantity: Number(t.quantity),
                  }),
                ),
            ),
            // Mises à jour
            Promise.all(
              values.tickets
                .filter((t) => t.id)
                .map((t) =>
                  eventService.updateTicketType(t.id as string, {
                    name: t.name,
                    price: Number(t.price),
                    quantity: Number(t.quantity),
                  }),
                ),
            ),
            // Retraits (suppression si jamais vendu, sinon désactivation)
            ...toRemove.map((id) => eventService.removeTicketType(id)),
          ]);

          const deactivated = removeResults.filter((r) => r?.action === "deactivated").length;
          const removedNote =
            deactivated > 0
              ? ` ${deactivated} billet(s) déjà vendu(s) ont été désactivés (retirés de la vente, historique conservé).`
              : "";

          toast.success(
            "Événement mis à jour",
            (action === "publish"
              ? "Les modifications sont visibles dans l'app mobile."
              : "Enregistré en brouillon.") + removedNote,
          );
        } else {
          // Création + types de billets.
          const event = await eventService.create(payload);
          for (const t of values.tickets) {
            await eventService.addTicketType(event.id, {
              name: t.name,
              price: Number(t.price),
              quantity: Number(t.quantity),
            });
          }
          toast.success(
            action === "publish" ? "Événement publié" : "Brouillon enregistré",
            action === "publish" ? "Il est maintenant visible dans l'app mobile." : "Vous pourrez le publier plus tard.",
          );
        }
        router.push("/events");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Une erreur est survenue.";
        toast.error("Échec de l'enregistrement", message);
      } finally {
        setSubmitting(false);
      }
    })();
  }

  const totalCapacity = tickets?.reduce((s, t) => s + (Number(t.quantity) || 0), 0) ?? 0;
  const potential = tickets?.reduce((s, t) => s + (Number(t.price) || 0) * (Number(t.quantity) || 0), 0) ?? 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted">
        Chargement de l&apos;événement…
      </div>
    );
  }

  return (
    <form className="space-y-5">
      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Informations de base</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Nom de l'événement" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="Ex. Afrobeat Festival 2026" />
          </Field>
          {isSA && (
            <Field label="Organisation" required error={errors.organizationId?.message}>
              <Select
                {...register("organizationId")}
                options={[{ value: "", label: "Sélectionner…" }, ...orgOptions.map((o) => ({ value: o.id, label: o.name }))]}
              />
            </Field>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie" required error={errors.categoryId?.message}>
              <Select
                {...register("categoryId")}
                options={[{ value: "", label: "Sélectionner…" }, ...categoryOptions.map((c) => ({ value: c.id, label: c.name }))]}
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
        <CardBody className="space-y-4">
          <Field label="Image de couverture" hint="PNG ou JPG · 5 Mo max.">
            {coverImage ? (
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Aperçu de la couverture"
                  className="h-32 w-56 shrink-0 rounded-[var(--radius-md)] border border-border object-cover"
                />
                <div className="flex flex-col gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 focus-within:ring-2">
                    <ImagePlus className="h-4 w-4" />
                    {uploadingCover ? "Téléversement…" : "Changer l'image"}
                    <input type="file" accept="image/*" className="sr-only" onChange={onCoverChange} disabled={uploadingCover} />
                  </label>
                  <Button type="button" variant="ghost" onClick={() => setCoverImage("")} disabled={uploadingCover}>
                    <Trash2 className="h-4 w-4" /> Retirer
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface-2 text-muted transition-colors hover:border-primary hover:text-primary">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">
                  {uploadingCover ? "Téléversement…" : "Téléverser une image"}
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={onCoverChange} disabled={uploadingCover} />
              </label>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {["Galerie", "Vidéos"].map((label) => (
              <div
                key={label}
                className="flex h-24 flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface-2 text-caption"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs font-medium">{label} — à venir</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => append({ id: "", name: "", price: 0, quantity: 100, saleStart: "", saleEnd: "" })}>
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
              <input type="hidden" {...register(`tickets.${i}.id`)} />
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
