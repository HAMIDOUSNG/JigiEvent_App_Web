"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import type { Locale } from "@/types";

function Toggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-caption">{description}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring ${on ? "bg-primary" : "bg-border-strong"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  useRequireAuth();
  const { locale, setLocale, t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState("profile");

  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres" description="Gérez votre compte et vos préférences." />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "profile", label: "Profil" },
          { value: "preferences", label: "Préférences" },
          { value: "notifications", label: "Notifications" },
          { value: "security", label: "Sécurité" },
        ]}
      />

      {tab === "profile" && (
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name ?? "Admin"} size="lg" />
              <Button variant="outline" size="sm">Changer la photo</Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom complet"><Input defaultValue={user?.name} /></Field>
              <Field label="E-mail"><Input type="email" defaultValue={user?.email} /></Field>
              <Field label="Rôle"><Input defaultValue={user?.role === "SUPER_ADMIN" ? "Super Admin" : "Administrateur"} disabled /></Field>
              <Field label="Organisation"><Input defaultValue={user?.organizationName} disabled /></Field>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Profil mis à jour")}>{t("common.save")}</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "preferences" && (
        <Card>
          <CardHeader><CardTitle>Préférences</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Field label={t("common.language")} className="max-w-xs">
              <Select
                value={locale}
                onChange={(e) => { setLocale(e.target.value as Locale); toast.success("Langue mise à jour"); }}
                options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]}
              />
            </Field>
            <Field label="Devise" className="max-w-xs">
              <Select
                options={[
                  { value: "XOF", label: "FCFA (XOF)" },
                  { value: "EUR", label: "Euro (EUR)" },
                  { value: "USD", label: "Dollar (USD)" },
                ]}
              />
            </Field>
            <Field label="Fuseau horaire" className="max-w-xs">
              <Select options={[{ value: "gmt", label: "GMT (Bamako)" }, { value: "wat", label: "WAT (UTC+1)" }]} />
            </Field>
          </CardBody>
        </Card>
      )}

      {tab === "notifications" && (
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardBody className="divide-y divide-border">
            <Toggle label="Nouvelles commandes" description="Recevoir une alerte à chaque nouvelle commande." defaultChecked />
            <Toggle label="Paiements" description="Notifications de paiement réussi ou échoué." defaultChecked />
            <Toggle label="Rapports hebdomadaires" description="Résumé de performance chaque lundi." />
            <Toggle label="Alertes de licence" description="Rappels avant expiration de licence." defaultChecked />
          </CardBody>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader><CardTitle>Sécurité</CardTitle></CardHeader>
          <CardBody className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mot de passe actuel"><Input type="password" placeholder="••••••••" /></Field>
              <div className="hidden sm:block" />
              <Field label="Nouveau mot de passe"><Input type="password" placeholder="••••••••" /></Field>
              <Field label="Confirmer"><Input type="password" placeholder="••••••••" /></Field>
            </div>
            <div className="border-t border-border pt-4">
              <Toggle label="Authentification à deux facteurs" description="Sécurisez votre compte avec un code supplémentaire." />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Mot de passe mis à jour")}>Mettre à jour</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
