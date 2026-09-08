"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS } from "@/i18n/locale";
import { toast } from "@/store/toast";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { t, locale, setLocale } = useI18n();

  const [email, setEmail] = useState("superadmin@horizon360.africa");
  const [password, setPassword] = useState("horizon360");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success(t("login.success"));
      router.replace("/dashboard");
    } else {
      setError(res.error ?? "Erreur");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Visual panel — African identity */}
      <div className="pattern-mudcloth relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2.5">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[#F7F3EC]/10 backdrop-blur">
              <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
                <circle cx="16" cy="17" r="6" fill="#C9A24B" />
                <path d="M4 22 Q16 12 28 22" stroke="#C65D3B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-[#F7F3EC]">
              Horizon<span className="text-accent">360</span>
            </span>
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight text-[#F7F3EC]">
            Une Afrique moderne,<br />
            <span className="text-accent">ambitieuse</span> et connectée.
          </h2>
          <p className="mt-4 text-[#F7F3EC]/70">{t("login.tagline")}</p>
        </div>

        <div className="relative z-10 flex gap-8 text-[#F7F3EC]/60">
          <div>
            <p className="font-display text-2xl font-bold text-[#F7F3EC]">12k+</p>
            <p className="text-xs">Utilisateurs</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-[#F7F3EC]">240+</p>
            <p className="text-xs">Événements</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-[#F7F3EC]">8</p>
            <p className="text-xs">Régions</p>
          </div>
        </div>

        {/* Decorative arcs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-accent/20" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border border-accent/10" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
          </div>

          <div className="mb-8">
            <h1 className="text-h1 font-display text-foreground">{t("login.title")}</h1>
            <p className="text-body-sm text-muted mt-1.5">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label={t("login.email")} htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
              />
            </Field>

            <Field label={t("login.password")} htmlFor="password" error={error}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong text-primary focus-ring accent-[#C65D3B]"
                />
                {t("login.remember")}
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                {t("login.forgot")}
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {t("login.submit")}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 rounded-[var(--radius-md)] border border-border bg-surface-2 p-3">
            <p className="text-caption">
              <span className="font-medium text-foreground-soft">Démo · </span>
              Super Admin : superadmin@horizon360.africa · Admin : admin@bamakoevents.ml —
              mot de passe : horizon360
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-2 text-xs text-muted">
            {LOCALES.map((l, i) => (
              <span key={l} className="flex items-center gap-2">
                {i > 0 && <span>·</span>}
                <button
                  onClick={() => setLocale(l)}
                  className={locale === l ? "font-semibold text-foreground" : "hover:text-foreground"}
                >
                  {LOCALE_LABELS[l]}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
