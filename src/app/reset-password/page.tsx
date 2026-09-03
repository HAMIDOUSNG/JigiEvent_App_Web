"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { toast } from "@/store/toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast.success("Mot de passe réinitialisé", "Vous pouvez maintenant vous connecter.");
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo />
        </div>
        <h1 className="text-h1 font-display text-foreground">Nouveau mot de passe</h1>
        <p className="text-body-sm text-muted mt-1.5">Choisissez un mot de passe sécurisé.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Nouveau mot de passe" htmlFor="password">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </Field>
          <Field label="Confirmer le mot de passe" htmlFor="confirm" error={error}>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Réinitialiser
          </Button>
        </form>
      </div>
    </div>
  );
}
