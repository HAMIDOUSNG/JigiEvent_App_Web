"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo />
        </div>

        {sent ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="text-h2 font-display text-foreground mt-4">E-mail envoyé</h1>
            <p className="text-body-sm text-muted mt-2">
              Si un compte existe pour <span className="font-medium text-foreground">{email}</span>,
              vous recevrez un lien de réinitialisation.
            </p>
            <Link href="/login" className="mt-6 inline-block">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-h1 font-display text-foreground">Mot de passe oublié</h1>
            <p className="text-body-sm text-muted mt-1.5">
              Saisissez votre e-mail pour recevoir un lien de réinitialisation.
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <Field label="Adresse e-mail" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Envoyer le lien
              </Button>
            </form>
            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
