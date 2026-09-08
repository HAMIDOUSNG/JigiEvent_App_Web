"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, ImagePlus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Input, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { categories, REGIONS } from "@/mocks/data";
import { organizationService, planService } from "@/services";
import { ENTITY_STATUS, SUBSCRIPTION_PERIOD_SUFFIX } from "@/constants/status";
import { formatCurrency } from "@/utils/format";
import { toast } from "@/store/toast";
import type { Organization } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Le nom de l'entreprise est requis."),
  categoryId: z.string().min(1, "Sélectionnez une catégorie."),
  type: z.enum(["private", "public"]),
  phone: z.string().min(6, "Numéro de téléphone requis."),
  email: z.string().email("E-mail invalide."),
  region: z.string().min(1, "Sélectionnez une région."),
  city: z.string().min(1, "Ville requise."),
  address: z.string().min(1, "Adresse requise."),
  loginEmail: z.string().email("E-mail de connexion invalide."),
  password: z.string().min(6, "6 caractères minimum."),
  status: z.enum(["active", "suspended", "pending"]),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const STATUS_OPTIONS = Object.entries(ENTITY_STATUS).map(([value, m]) => ({ value, label: m.labelFr }));

export function OrganizationForm({
  mode = "create",
  organization,
}: {
  mode?: "create" | "edit";
  organization?: Organization;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logo, setLogo] = useState<string>(organization?.logo ?? "");

  const { data: plans } = useQuery({ queryKey: ["plans-active"], queryFn: () => planService.all() });
  const [planId, setPlanId] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization?.name ?? "",
      categoryId: organization?.categoryId ?? "",
      type: organization?.type ?? "private",
      phone: organization?.phone ?? "",
      email: organization?.email ?? "",
      region: organization?.region ?? "",
      city: organization?.city ?? "",
      address: organization?.address ?? "",
      loginEmail: organization?.loginEmail ?? organization?.email ?? "",
      password: "",
      status: organization?.status ?? "active",
    },
  });

  const activePlans = (plans ?? []).filter((p) => p.status === "active");
  const nameValue = watch("name");

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier invalide", "Veuillez sélectionner une image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde", "Taille maximale : 2 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: FormOutput) {
    setSubmitting(true);
    const payload = { ...values, logo };
    if (mode === "edit" && organization) {
      await organizationService.update(organization.id, payload);
      toast.success("Entreprise mise à jour", values.name);
    } else {
      await organizationService.create(payload);
      toast.success("Compte entreprise créé", `${values.name} dispose maintenant d'un espace Admin.`);
    }
    setSubmitting(false);
    router.push("/organizations");
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {/* Company info */}
      <Card>
        <CardHeader><CardTitle>Informations de l&apos;entreprise</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Logo de l'entreprise" hint="PNG, JPG ou SVG · 2 Mo max.">
            <div className="flex items-center gap-4">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt="Logo de l'entreprise"
                  className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] border border-border object-cover"
                />
              ) : (
                <Avatar name={nameValue || "?"} size="lg" className="h-16 w-16 rounded-[var(--radius-md)] text-lg" />
              )}
              <div className="flex items-center gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 focus-within:ring-2">
                  <ImagePlus className="h-4 w-4" />
                  {logo ? "Changer" : "Téléverser"}
                  <input type="file" accept="image/*" className="sr-only" onChange={onLogoChange} />
                </label>
                {logo && (
                  <Button type="button" variant="ghost" onClick={() => setLogo("")}>
                    <Trash2 className="h-4 w-4" /> Retirer
                  </Button>
                )}
              </div>
            </div>
          </Field>
          <Field label="Nom de l'entreprise" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="Ex. Bamako Events" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie / secteur d'activité" required error={errors.categoryId?.message}>
              <Select
                {...register("categoryId")}
                options={[{ value: "", label: "Sélectionner…" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </Field>
            <Field label="Type" required error={errors.type?.message}>
              <Select
                {...register("type")}
                options={[
                  { value: "private", label: "Privée" },
                  { value: "public", label: "Publique" },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Numéro de téléphone" required error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="+223 70 00 00 00" />
            </Field>
            <Field label="Adresse e-mail" required error={errors.email?.message}>
              <Input type="email" {...register("email")} placeholder="contact@entreprise.ml" />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader><CardTitle>Localisation</CardTitle></CardHeader>
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
            <Input {...register("address")} placeholder="Ex. Av. de l'Indépendance" />
          </Field>
        </CardBody>
      </Card>

      {/* Login credentials */}
      <Card>
        <CardHeader><CardTitle>Informations de connexion</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="E-mail de connexion" required error={errors.loginEmail?.message}>
              <Input type="email" {...register("loginEmail")} placeholder="admin@entreprise.ml" />
            </Field>
            <Field
              label="Mot de passe"
              required={mode === "create"}
              error={errors.password?.message}
              hint={mode === "edit" ? "Laissez vide pour conserver le mot de passe actuel." : undefined}
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-sand hover:text-foreground focus-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>
          <Field label="Statut du compte" required error={errors.status?.message}>
            <Select {...register("status")} options={STATUS_OPTIONS} />
          </Field>
        </CardBody>
      </Card>

      {/* Subscription selection (create only) */}
      {mode === "create" && (
        <Card>
          <CardHeader><CardTitle>Abonnement (optionnel)</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Field label="Plan d'abonnement" hint="L'entreprise pourra publier tant que son abonnement est actif.">
              <Select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                options={[
                  { value: "", label: "Aucun pour le moment" },
                  ...activePlans.map((p) => ({
                    value: p.id,
                    label: `${p.name} — ${formatCurrency(p.price)} / ${SUBSCRIPTION_PERIOD_SUFFIX[p.period]}`,
                  })),
                ]}
              />
            </Field>
          </CardBody>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/organizations")}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === "edit" ? "Enregistrer" : "Créer le compte"}
        </Button>
      </div>
    </form>
  );
}
