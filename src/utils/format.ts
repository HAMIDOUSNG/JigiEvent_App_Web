import { format, formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import type { Locale } from "@/types";

const DATE_LOCALES = { fr, en: enUS };

// ============================================================
// Currency — FCFA / XOF by default. Prepared for multi-currency.
// ============================================================
export interface CurrencyConfig {
  code: string;
  symbol: string;
  position: "prefix" | "suffix";
}

export const DEFAULT_CURRENCY: CurrencyConfig = {
  code: "XOF",
  symbol: "FCFA",
  position: "suffix",
};

/** Format an amount as "25 000 FCFA". Space thousands separator. */
export function formatCurrency(
  amount: number,
  currency: CurrencyConfig = DEFAULT_CURRENCY
): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return currency.position === "suffix"
    ? `${formatted} ${currency.symbol}`
    : `${currency.symbol} ${formatted}`;
}

/** Compact currency for KPI cards: 2 000 000 -> 2 M FCFA */
export function formatCurrencyCompact(
  amount: number,
  currency: CurrencyConfig = DEFAULT_CURRENCY
): string {
  const abs = Math.abs(amount);
  let value = amount;
  let unit = "";
  if (abs >= 1_000_000_000) {
    value = amount / 1_000_000_000;
    unit = " Md";
  } else if (abs >= 1_000_000) {
    value = amount / 1_000_000;
    unit = " M";
  } else if (abs >= 1_000) {
    value = amount / 1_000;
    unit = " k";
  }
  const num =
    unit === ""
      ? new Intl.NumberFormat("fr-FR").format(Math.round(value))
      : value.toFixed(value < 10 ? 1 : 0).replace(".", ",");
  return `${num}${unit} ${currency.symbol}`;
}

// ============================================================
// Numbers
// ============================================================
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(".", ",")} k`;
  return formatNumber(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")} %`;
}

// ============================================================
// Dates
// ============================================================
function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function formatDate(value: string | Date, locale: Locale = "fr"): string {
  return format(toDate(value), "dd MMM yyyy", { locale: DATE_LOCALES[locale] });
}

export function formatDateTime(value: string | Date, locale: Locale = "fr"): string {
  return format(toDate(value), "dd MMM yyyy · HH:mm", { locale: DATE_LOCALES[locale] });
}

export function formatTime(value: string | Date): string {
  return format(toDate(value), "HH:mm");
}

export function timeAgo(value: string | Date, locale: Locale = "fr"): string {
  return formatDistanceToNow(toDate(value), {
    addSuffix: true,
    locale: DATE_LOCALES[locale],
  });
}

export function daysUntil(value: string | Date): number {
  return differenceInDays(toDate(value), new Date());
}

// ============================================================
// Misc
// ============================================================
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
