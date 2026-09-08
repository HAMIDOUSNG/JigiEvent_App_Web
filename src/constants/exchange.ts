import { currencyForCountry } from "@/constants/countries";
import type { CurrencyConfig } from "@/utils/format";

// ============================================================
// Conversion de devise pour les agrégats consolidés.
//
// La plateforme opère dans plusieurs devises. Pour additionner des
// revenus provenant de pays différents, on convertit tout vers une
// devise de référence unique (XOF / FCFA).
//
// NOTE : ces taux sont statiques pour la démo. En production, ils
// doivent provenir d'un service de taux de change (mis à jour
// régulièrement) plutôt que d'être codés en dur.
// ============================================================

export const REFERENCE_CURRENCY: CurrencyConfig = {
  code: "XOF",
  symbol: "FCFA",
  position: "suffix",
};

/**
 * Taux de conversion : 1 unité de la devise -> montant en devise de
 * référence (XOF). Ex. 1 EUR ≈ 655,957 XOF.
 */
const RATES_TO_REFERENCE: Record<string, number> = {
  XOF: 1,
  XAF: 1, // parité fixe XOF/XAF
  NGN: 0.39, // 1 NGN ≈ 0,39 XOF
  GHS: 41, // 1 GHS ≈ 41 XOF
  GNF: 0.068,
  KES: 4.6,
  TZS: 0.24,
  UGX: 0.16,
  RWF: 0.45,
  ETB: 5.2,
  MAD: 61,
  DZD: 4.5,
  TND: 195,
  EGP: 12.5,
  ZAR: 33,
  AOA: 0.66,
  MZN: 9.5,
};

/** Taux d'une devise vers la référence (repli sur 1 si inconnue). */
export function rateToReference(currencyCode: string): number {
  return RATES_TO_REFERENCE[currencyCode] ?? 1;
}

/** Convertit un montant d'une devise donnée vers la devise de référence. */
export function toReferenceCurrency(amount: number, currencyCode: string): number {
  return Math.round(amount * rateToReference(currencyCode));
}

/** Convertit un montant exprimé dans la devise du pays vers la référence. */
export function countryAmountToReference(amount: number, countryCode: string | undefined): number {
  return toReferenceCurrency(amount, currencyForCountry(countryCode).code);
}
