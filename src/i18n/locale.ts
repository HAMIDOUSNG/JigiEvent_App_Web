import type { Locale } from "@/types";

/** Locales supportées par la plateforme, dans l'ordre d'affichage. */
export const LOCALES: Locale[] = ["fr", "en", "ar"];

/** Libellés natifs des langues (affichés dans les sélecteurs). */
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

/** Locales à lecture de droite à gauche. */
const RTL_LOCALES: Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/**
 * Résout un libellé multilingue selon la locale, avec repli sur le français.
 * Accepte des objets partiels (ex. seulement fr/en) : l'arabe retombe alors sur le fr.
 */
export function localizeLabel(
  locale: Locale,
  labels: { fr: string; en: string; ar?: string }
): string {
  if (locale === "en") return labels.en;
  if (locale === "ar") return labels.ar ?? labels.fr;
  return labels.fr;
}
