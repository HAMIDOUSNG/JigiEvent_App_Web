"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Bell, Mail, MessageSquare, Smartphone, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { notificationService } from "@/services";
import { formatDateTime, formatNumber } from "@/utils/format";
import { toast } from "@/store/toast";
import type { NotificationChannel } from "@/types";

const CHANNEL_META: Record<NotificationChannel, { label: string; icon: typeof Bell; tone: "primary" | "info" | "secondary" | "accent" }> = {
  push: { label: "Push", icon: Smartphone, tone: "primary" },
  sms: { label: "SMS", icon: MessageSquare, tone: "info" },
  email: { label: "E-mail", icon: Mail, tone: "secondary" },
  in_app: { label: "In-app", icon: Bell, tone: "accent" },
};

const STATUS_TONE = { sent: "success", scheduled: "info", draft: "neutral" } as const;
const STATUS_LABEL = { sent: "Envoyée", scheduled: "Programmée", draft: "Brouillon" } as const;

export default function NotificationsPage() {
  useRequireAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: notificationService.all });

  async function send() {
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    toast.success("Notification programmée");
    setModalOpen(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Push, SMS, e-mail et notifications in-app."
        action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle notification</Button>}
      />

      {/* Channel summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(CHANNEL_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const count = campaigns?.filter((c) => c.channel === key).length ?? 0;
          const bg = {
            primary: "bg-primary-50",
            secondary: "bg-secondary-50",
            accent: "bg-accent-50",
            info: "bg-info-bg",
          }[meta.tone];
          return (
            <Card key={key}>
              <CardBody className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${bg}`}>
                  <Icon className="h-5 w-5 text-foreground-soft" />
                </span>
                <div>
                  <p className="text-h4 text-foreground">{count}</p>
                  <p className="text-caption">{meta.label}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Campagnes</CardTitle></CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-5"><SkeletonTable rows={4} cols={4} /></div>
          ) : campaigns?.length === 0 ? (
            <EmptyState icon={Bell} title="Aucune notification" />
          ) : (
            <ul className="divide-y divide-border">
              {campaigns?.map((c) => {
                const meta = CHANNEL_META[c.channel];
                const Icon = meta.icon;
                return (
                  <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-sand text-foreground-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">{c.title}</p>
                        <Badge tone="neutral" dot={false}>{meta.label}</Badge>
                      </div>
                      <p className="truncate text-caption">{c.message}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-caption">{c.audience}</p>
                      <p className="text-caption">{formatNumber(c.reach)} destinataires</p>
                    </div>
                    <div className="text-right">
                      <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                      <p className="text-caption mt-1">{formatDateTime(c.scheduledAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle notification"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={send} loading={sending}><Send className="h-4 w-4" /> Programmer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Canal" required>
            <Select options={Object.entries(CHANNEL_META).map(([value, m]) => ({ value, label: m.label }))} />
          </Field>
          <Field label="Titre" required><Input placeholder="Titre de la notification" /></Field>
          <Field label="Message" required><Textarea placeholder="Contenu du message…" /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Audience" required>
              <Select
                options={[
                  { value: "all", label: "Tous les utilisateurs" },
                  { value: "admins", label: "Admins" },
                  { value: "region", label: "Région spécifique" },
                  { value: "organization", label: "Organisation spécifique" },
                  { value: "event", label: "Événement spécifique" },
                ]}
              />
            </Field>
            <Field label="Programmation"><Input type="datetime-local" /></Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
