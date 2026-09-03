import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="pattern-kente mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border">
        <span className="font-display text-3xl font-bold text-primary">404</span>
      </div>
      <div className="mb-4"><Logo /></div>
      <h1 className="text-h2 font-display text-foreground">Page introuvable</h1>
      <p className="text-body-sm text-muted mt-1.5 max-w-sm">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
