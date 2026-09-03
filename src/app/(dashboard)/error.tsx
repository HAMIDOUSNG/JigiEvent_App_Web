"use client";

import { ErrorState } from "@/components/ui/States";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card-surface">
      <ErrorState
        title="Une erreur est survenue."
        description="Impossible de charger cette page. Réessayez."
        onRetry={reset}
      />
    </div>
  );
}
