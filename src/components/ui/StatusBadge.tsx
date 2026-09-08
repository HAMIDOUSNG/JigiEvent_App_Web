"use client";

import { Badge } from "./Badge";
import type { StatusMeta } from "@/constants/status";
import { useI18n } from "@/i18n/I18nProvider";
import { localizeLabel } from "@/i18n/locale";

export function StatusBadge({ meta }: { meta: StatusMeta }) {
  const { locale } = useI18n();
  return (
    <Badge tone={meta.tone}>
      {localizeLabel(locale, { fr: meta.labelFr, en: meta.labelEn, ar: meta.labelAr })}
    </Badge>
  );
}
