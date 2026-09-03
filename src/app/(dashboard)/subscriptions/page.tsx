"use client";

import { Check } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

const PLANS = [
  {
    name: "Standard",
    price: 150_000,
    period: "an",
    highlight: false,
    features: ["Jusqu'à 10 événements / an", "Billetterie de base", "Support e-mail", "Statistiques essentielles"],
  },
  {
    name: "Business",
    price: 450_000,
    period: "an",
    highlight: true,
    features: ["Événements illimités", "Promotions & codes promo", "Support prioritaire", "Analytique avancée", "Multi-utilisateurs"],
  },
  {
    name: "Premium",
    price: 1_200_000,
    period: "an",
    highlight: false,
    features: ["Tout Business", "Commission réduite", "Gestionnaire dédié", "API & intégrations", "Personnalisation avancée"],
  },
];

export default function SubscriptionsPage() {
  useRequireAuth(["SUPER_ADMIN"]);

  return (
    <div className="space-y-5">
      <PageHeader title="Abonnements" description="Formules de licence proposées aux organisateurs." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={cn(plan.highlight && "ring-2 ring-primary")}>
            <CardBody className="flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-display text-foreground">{plan.name}</h3>
                {plan.highlight && <Badge tone="accent" dot={false}>Populaire</Badge>}
              </div>
              <p className="mt-3">
                <span className="text-h1 font-display text-foreground">{formatCurrency(plan.price)}</span>
                <span className="text-muted"> / {plan.period}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.highlight ? "primary" : "outline"} className="mt-6 w-full">
                Gérer le plan
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
