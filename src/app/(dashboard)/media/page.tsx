"use client";

import { UploadCloud, ImageIcon, Film, FileText, MoreHorizontal, Download, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "@/store/toast";

const MEDIA = [
  { id: "m1", name: "afrobeat-festival-cover.jpg", type: "image", size: "2.4 Mo" },
  { id: "m2", name: "bamako-music-night.jpg", type: "image", size: "1.8 Mo" },
  { id: "m3", name: "teaser-festival.mp4", type: "video", size: "18.2 Mo" },
  { id: "m4", name: "fashion-week-gallery-1.jpg", type: "image", size: "3.1 Mo" },
  { id: "m5", name: "programme-2026.pdf", type: "doc", size: "820 Ko" },
  { id: "m6", name: "sahel-sports-banner.jpg", type: "image", size: "2.0 Mo" },
  { id: "m7", name: "business-summit-intro.mp4", type: "video", size: "24.6 Mo" },
  { id: "m8", name: "food-festival-cover.jpg", type: "image", size: "2.7 Mo" },
];

const ICONS = { image: ImageIcon, video: Film, doc: FileText };

export default function MediaPage() {
  useRequireAuth(["SUPER_ADMIN"]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Médias"
        description="Bibliothèque de médias de la plateforme."
        action={<Button onClick={() => toast.info("Téléversement", "Sélectionnez des fichiers")}><UploadCloud className="h-4 w-4" /> Téléverser</Button>}
      />

      <button
        onClick={() => toast.info("Téléversement", "Glissez-déposez vos fichiers ici")}
        className="pattern-dots flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong bg-surface-2 py-12 text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <UploadCloud className="h-8 w-8" />
        <p className="text-sm font-medium">Glissez-déposez ou cliquez pour téléverser</p>
        <p className="text-caption">Images, vidéos et documents · 25 Mo max.</p>
      </button>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MEDIA.map((m) => {
          const Icon = ICONS[m.type as keyof typeof ICONS];
          return (
            <Card key={m.id} className="overflow-hidden">
              <div className="pattern-kente flex h-28 items-center justify-center border-b border-border">
                <Icon className="h-8 w-8 text-primary/40" />
              </div>
              <CardBody className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-caption">{m.size}</p>
                </div>
                <Dropdown
                  trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
                  items={[
                    { label: "Télécharger", icon: Download, onClick: () => toast.success("Téléchargement", m.name) },
                    { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => toast.error("Supprimé", m.name) },
                  ]}
                />
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
