"use client";

import { Badge } from "./Badge";
import type { StatusMeta } from "@/constants/status";
import { useI18n } from "@/i18n/I18nProvider";

export function StatusBadge({ meta }: { meta: StatusMeta }) {
  const { locale } = useI18n();
  return <Badge tone={meta.tone}>{locale === "fr" ? meta.labelFr : meta.labelEn}</Badge>;
}
