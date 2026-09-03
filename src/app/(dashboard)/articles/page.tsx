"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Pencil, Trash2, MoreHorizontal, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { articleService } from "@/services";
import { formatDate, formatNumber } from "@/utils/format";
import { toast } from "@/store/toast";

const STATUS_TONE = { published: "success", draft: "neutral", archived: "warning" } as const;
const STATUS_LABEL = { published: "Publié", draft: "Brouillon", archived: "Archivé" } as const;

export default function ArticlesPage() {
  useRequireAuth(["SUPER_ADMIN"]);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: articles, isLoading } = useQuery({ queryKey: ["articles"], queryFn: articleService.all });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Articles"
        description="Blog, actualités et contenus éditoriaux."
        action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvel article</Button>}
      />

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles?.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="pattern-kente relative flex h-32 items-center justify-center border-b border-border">
                <Newspaper className="h-8 w-8 text-primary/40" />
                <Badge tone={STATUS_TONE[a.status]} className="absolute right-3 top-3">{STATUS_LABEL[a.status]}</Badge>
              </div>
              <CardBody>
                <div className="flex items-center justify-between">
                  <Badge tone="neutral" dot={false}>{a.category}</Badge>
                  <Dropdown
                    trigger={<span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-sand"><MoreHorizontal className="h-4.5 w-4.5" /></span>}
                    items={[
                      { label: "Aperçu", icon: Eye, onClick: () => toast.info("Aperçu", a.title) },
                      { label: "Modifier", icon: Pencil, onClick: () => toast.info("Modifier", a.title) },
                      { label: "Supprimer", icon: Trash2, tone: "danger", onClick: () => toast.error("Supprimé", a.title) },
                    ]}
                  />
                </div>
                <h3 className="text-h4 text-foreground mt-2 line-clamp-2">{a.title}</h3>
                <p className="text-body-sm text-muted mt-1 line-clamp-2">{a.excerpt}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-caption">
                  <span>{a.author}</span>
                  <span>{a.status === "published" ? `${formatNumber(a.views)} vues · ${formatDate(a.publishedDate)}` : "Brouillon"}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvel article"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="ghost" onClick={() => { toast.success("Brouillon enregistré"); setModalOpen(false); }}>Brouillon</Button>
            <Button onClick={() => { toast.success("Article publié"); setModalOpen(false); }}>Publier</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Titre" required><Input placeholder="Titre de l'article" /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie">
              <Select options={[{ value: "news", label: "Actualités" }, { value: "blog", label: "Blog" }, { value: "guide", label: "Guide" }]} />
            </Field>
            <Field label="Auteur"><Input placeholder="Nom de l'auteur" /></Field>
          </div>
          <Field label="Contenu" required><Textarea className="min-h-40" placeholder="Rédigez votre article…" /></Field>
        </div>
      </Modal>
    </div>
  );
}
