import type { CurrencyConfig } from "@/utils/format";
import type { PaymentMethod } from "@/types";

// ============================================================
// Référentiel des pays africains supportés par la plateforme.
// Chaque pays porte sa devise, son indicatif, ses régions
// principales et les moyens de paiement disponibles.
// ============================================================

export interface Country {
  /** Code ISO 3166-1 alpha-2 (ex. "ML"). */
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  currency: CurrencyConfig;
  regions: string[];
  paymentMethods: PaymentMethod[];
}

// Regroupements de devises partagées.
const XOF: CurrencyConfig = { code: "XOF", symbol: "FCFA", position: "suffix" };
const XAF: CurrencyConfig = { code: "XAF", symbol: "FCFA", position: "suffix" };

export const COUNTRIES: Country[] = [
  // --- Afrique de l'Ouest (UEMOA — XOF) ---
  {
    code: "ML",
    name: "Mali",
    flag: "🇲🇱",
    dialCode: "+223",
    currency: XOF,
    regions: ["Bamako", "Sikasso", "Ségou", "Kayes", "Mopti", "Koulikoro", "Gao", "Tombouctou"],
    paymentMethods: ["orange_money", "moov_money", "bank_card"],
  },
  {
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    dialCode: "+221",
    currency: XOF,
    regions: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Diourbel"],
    paymentMethods: ["wave", "orange_money", "free_money", "bank_card"],
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    dialCode: "+225",
    currency: XOF,
    regions: ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro", "Korhogo", "Daloa"],
    paymentMethods: ["orange_money", "mtn_momo", "moov_money", "wave", "bank_card"],
  },
  {
    code: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫",
    dialCode: "+226",
    currency: XOF,
    regions: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Banfora"],
    paymentMethods: ["orange_money", "moov_money", "bank_card"],
  },
  {
    code: "BJ",
    name: "Bénin",
    flag: "🇧🇯",
    dialCode: "+229",
    currency: XOF,
    regions: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Djougou"],
    paymentMethods: ["mtn_momo", "moov_money", "bank_card"],
  },
  {
    code: "TG",
    name: "Togo",
    flag: "🇹🇬",
    dialCode: "+228",
    currency: XOF,
    regions: ["Lomé", "Sokodé", "Kara", "Kpalimé", "Atakpamé"],
    paymentMethods: ["moov_money", "mtn_momo", "bank_card"],
  },
  {
    code: "NE",
    name: "Niger",
    flag: "🇳🇪",
    dialCode: "+227",
    currency: XOF,
    regions: ["Niamey", "Zinder", "Maradi", "Agadez", "Tahoua"],
    paymentMethods: ["orange_money", "airtel_money", "bank_card"],
  },
  {
    code: "GW",
    name: "Guinée-Bissau",
    flag: "🇬🇼",
    dialCode: "+245",
    currency: XOF,
    regions: ["Bissau", "Bafatá", "Gabú", "Bissorã"],
    paymentMethods: ["orange_money", "bank_card"],
  },

  // --- Afrique de l'Ouest (hors zone CFA) ---
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    dialCode: "+234",
    currency: { code: "NGN", symbol: "₦", position: "prefix" },
    regions: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City", "Kaduna"],
    paymentMethods: ["bank_card", "airtel_money", "mtn_momo"],
  },
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    dialCode: "+233",
    currency: { code: "GHS", symbol: "GH₵", position: "prefix" },
    regions: ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast"],
    paymentMethods: ["mtn_momo", "airtel_money", "bank_card"],
  },
  {
    code: "GN",
    name: "Guinée",
    flag: "🇬🇳",
    dialCode: "+224",
    currency: { code: "GNF", symbol: "FG", position: "suffix" },
    regions: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé"],
    paymentMethods: ["orange_money", "mtn_momo", "bank_card"],
  },

  // --- Afrique centrale (CEMAC — XAF) ---
  {
    code: "CM",
    name: "Cameroun",
    flag: "🇨🇲",
    dialCode: "+237",
    currency: XAF,
    regions: ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Bamenda", "Maroua"],
    paymentMethods: ["mtn_momo", "orange_money", "bank_card"],
  },
  {
    code: "GA",
    name: "Gabon",
    flag: "🇬🇦",
    dialCode: "+241",
    currency: XAF,
    regions: ["Libreville", "Port-Gentil", "Franceville", "Oyem"],
    paymentMethods: ["airtel_money", "moov_money", "bank_card"],
  },
  {
    code: "CG",
    name: "Congo",
    flag: "🇨🇬",
    dialCode: "+242",
    currency: XAF,
    regions: ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi"],
    paymentMethods: ["airtel_money", "mtn_momo", "bank_card"],
  },
  {
    code: "TD",
    name: "Tchad",
    flag: "🇹🇩",
    dialCode: "+235",
    currency: XAF,
    regions: ["N'Djaména", "Moundou", "Sarh", "Abéché"],
    paymentMethods: ["airtel_money", "bank_card"],
  },

  // --- Afrique de l'Est ---
  {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    dialCode: "+254",
    currency: { code: "KES", symbol: "KSh", position: "prefix" },
    regions: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
    paymentMethods: ["mpesa", "airtel_money", "bank_card"],
  },
  {
    code: "TZ",
    name: "Tanzanie",
    flag: "🇹🇿",
    dialCode: "+255",
    currency: { code: "TZS", symbol: "TSh", position: "prefix" },
    regions: ["Dar es Salaam", "Dodoma", "Mwanza", "Arusha", "Zanzibar"],
    paymentMethods: ["mpesa", "airtel_money", "bank_card"],
  },
  {
    code: "UG",
    name: "Ouganda",
    flag: "🇺🇬",
    dialCode: "+256",
    currency: { code: "UGX", symbol: "USh", position: "prefix" },
    regions: ["Kampala", "Gulu", "Mbarara", "Jinja", "Entebbe"],
    paymentMethods: ["mtn_momo", "airtel_money", "bank_card"],
  },
  {
    code: "RW",
    name: "Rwanda",
    flag: "🇷🇼",
    dialCode: "+250",
    currency: { code: "RWF", symbol: "FRw", position: "suffix" },
    regions: ["Kigali", "Butare", "Gisenyi", "Ruhengeri"],
    paymentMethods: ["mtn_momo", "airtel_money", "bank_card"],
  },
  {
    code: "ET",
    name: "Éthiopie",
    flag: "🇪🇹",
    dialCode: "+251",
    currency: { code: "ETB", symbol: "Br", position: "prefix" },
    regions: ["Addis-Abeba", "Dire Dawa", "Mekele", "Gondar", "Hawassa"],
    paymentMethods: ["bank_card"],
  },

  // --- Afrique du Nord ---
  {
    code: "MA",
    name: "Maroc",
    flag: "🇲🇦",
    dialCode: "+212",
    currency: { code: "MAD", symbol: "DH", position: "suffix" },
    regions: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"],
    paymentMethods: ["bank_card"],
  },
  {
    code: "DZ",
    name: "Algérie",
    flag: "🇩🇿",
    dialCode: "+213",
    currency: { code: "DZD", symbol: "DA", position: "suffix" },
    regions: ["Alger", "Oran", "Constantine", "Annaba", "Blida"],
    paymentMethods: ["bank_card"],
  },
  {
    code: "TN",
    name: "Tunisie",
    flag: "🇹🇳",
    dialCode: "+216",
    currency: { code: "TND", symbol: "DT", position: "suffix" },
    regions: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte"],
    paymentMethods: ["bank_card"],
  },
  {
    code: "EG",
    name: "Égypte",
    flag: "🇪🇬",
    dialCode: "+20",
    currency: { code: "EGP", symbol: "E£", position: "prefix" },
    regions: ["Le Caire", "Alexandrie", "Gizeh", "Louxor", "Assouan"],
    paymentMethods: ["bank_card"],
  },

  // --- Afrique australe ---
  {
    code: "ZA",
    name: "Afrique du Sud",
    flag: "🇿🇦",
    dialCode: "+27",
    currency: { code: "ZAR", symbol: "R", position: "prefix" },
    regions: ["Johannesburg", "Le Cap", "Durban", "Pretoria", "Port Elizabeth"],
    paymentMethods: ["bank_card"],
  },
  {
    code: "AO",
    name: "Angola",
    flag: "🇦🇴",
    dialCode: "+244",
    currency: { code: "AOA", symbol: "Kz", position: "suffix" },
    regions: ["Luanda", "Huambo", "Lobito", "Benguela"],
    paymentMethods: ["bank_card"],
  },
  {
    code: "MZ",
    name: "Mozambique",
    flag: "🇲🇿",
    dialCode: "+258",
    currency: { code: "MZN", symbol: "MT", position: "suffix" },
    regions: ["Maputo", "Matola", "Beira", "Nampula"],
    paymentMethods: ["mpesa", "bank_card"],
  },
];

export const DEFAULT_COUNTRY_CODE = "ML";

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string | undefined): Country | undefined {
  return code ? COUNTRY_BY_CODE.get(code) : undefined;
}

/** Devise d'un pays, avec repli sur le FCFA (XOF) par défaut. */
export function currencyForCountry(code: string | undefined): CurrencyConfig {
  return getCountry(code)?.currency ?? XOF;
}

/** Options prêtes pour un <Select>. */
export const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.name}`,
}));
