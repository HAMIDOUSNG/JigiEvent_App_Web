import type {
  EventStatus,
  OrderStatus,
  PaymentStatus,
  LicenseStatus,
  EntityStatus,
  TicketStatus,
  PromotionStatus,
  SubscriptionStatus,
  SubscriptionPeriod,
  PlanStatus,
} from "@/types";

export type BadgeTone = "success" | "warning" | "error" | "info" | "neutral" | "accent";

export interface StatusMeta {
  labelFr: string;
  labelEn: string;
  labelAr?: string;
  tone: BadgeTone;
}

export const EVENT_STATUS: Record<EventStatus, StatusMeta> = {
  draft: { labelFr: "Brouillon", labelEn: "Draft", labelAr: "مسودة", tone: "neutral" },
  pending: { labelFr: "En attente", labelEn: "Pending", labelAr: "قيد الانتظار", tone: "warning" },
  published: { labelFr: "Publié", labelEn: "Published", labelAr: "منشور", tone: "success" },
  upcoming: { labelFr: "À venir", labelEn: "Upcoming", labelAr: "قادم", tone: "info" },
  ongoing: { labelFr: "En cours", labelEn: "Ongoing", labelAr: "جارٍ", tone: "accent" },
  completed: { labelFr: "Terminé", labelEn: "Completed", labelAr: "منتهٍ", tone: "info" },
  cancelled: { labelFr: "Annulé", labelEn: "Cancelled", labelAr: "ملغى", tone: "error" },
  rejected: { labelFr: "Rejeté", labelEn: "Rejected", labelAr: "مرفوض", tone: "error" },
};

export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  pending: { labelFr: "En attente", labelEn: "Pending", labelAr: "قيد الانتظار", tone: "warning" },
  paid: { labelFr: "Payé", labelEn: "Paid", labelAr: "مدفوع", tone: "success" },
  failed: { labelFr: "Échoué", labelEn: "Failed", labelAr: "فشل", tone: "error" },
  cancelled: { labelFr: "Annulé", labelEn: "Cancelled", labelAr: "ملغى", tone: "neutral" },
  refunded: { labelFr: "Remboursé", labelEn: "Refunded", labelAr: "مسترد", tone: "info" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  pending: { labelFr: "En attente", labelEn: "Pending", labelAr: "قيد الانتظار", tone: "warning" },
  successful: { labelFr: "Réussi", labelEn: "Successful", labelAr: "ناجح", tone: "success" },
  failed: { labelFr: "Échoué", labelEn: "Failed", labelAr: "فشل", tone: "error" },
  refunded: { labelFr: "Remboursé", labelEn: "Refunded", labelAr: "مسترد", tone: "info" },
};

export const LICENSE_STATUS: Record<LicenseStatus, StatusMeta> = {
  active: { labelFr: "Active", labelEn: "Active", labelAr: "نشط", tone: "success" },
  expiring_soon: { labelFr: "Expire bientôt", labelEn: "Expiring soon", labelAr: "على وشك الانتهاء", tone: "warning" },
  expired: { labelFr: "Expirée", labelEn: "Expired", labelAr: "منتهٍ", tone: "error" },
  suspended: { labelFr: "Suspendue", labelEn: "Suspended", labelAr: "موقوف", tone: "neutral" },
};

export const ENTITY_STATUS: Record<EntityStatus, StatusMeta> = {
  active: { labelFr: "Actif", labelEn: "Active", labelAr: "نشط", tone: "success" },
  suspended: { labelFr: "Suspendu", labelEn: "Suspended", labelAr: "موقوف", tone: "error" },
  pending: { labelFr: "En attente", labelEn: "Pending", labelAr: "قيد الانتظار", tone: "warning" },
};

export const TICKET_STATUS: Record<TicketStatus, StatusMeta> = {
  on_sale: { labelFr: "En vente", labelEn: "On sale", labelAr: "معروض للبيع", tone: "success" },
  sold_out: { labelFr: "Épuisé", labelEn: "Sold out", labelAr: "نفدت الكمية", tone: "error" },
  paused: { labelFr: "En pause", labelEn: "Paused", labelAr: "متوقف مؤقتاً", tone: "warning" },
  ended: { labelFr: "Terminé", labelEn: "Ended", labelAr: "منتهٍ", tone: "neutral" },
};

export const PROMOTION_STATUS: Record<PromotionStatus, StatusMeta> = {
  active: { labelFr: "Active", labelEn: "Active", labelAr: "نشط", tone: "success" },
  scheduled: { labelFr: "Programmée", labelEn: "Scheduled", labelAr: "مجدول", tone: "info" },
  ended: { labelFr: "Terminée", labelEn: "Ended", labelAr: "منتهٍ", tone: "neutral" },
  draft: { labelFr: "Brouillon", labelEn: "Draft", labelAr: "مسودة", tone: "neutral" },
};

export const SUBSCRIPTION_STATUS: Record<SubscriptionStatus, StatusMeta> = {
  active: { labelFr: "Actif", labelEn: "Active", labelAr: "نشط", tone: "success" },
  expired: { labelFr: "Expiré", labelEn: "Expired", labelAr: "منتهٍ", tone: "error" },
  suspended: { labelFr: "Suspendu", labelEn: "Suspended", labelAr: "موقوف", tone: "neutral" },
};

export const PLAN_STATUS: Record<PlanStatus, StatusMeta> = {
  active: { labelFr: "Actif", labelEn: "Active", labelAr: "نشط", tone: "success" },
  inactive: { labelFr: "Inactif", labelEn: "Inactive", labelAr: "غير نشط", tone: "neutral" },
};

export const SUBSCRIPTION_PERIOD: Record<SubscriptionPeriod, StatusMeta> = {
  daily: { labelFr: "Journalier", labelEn: "Daily", labelAr: "يومي", tone: "info" },
  monthly: { labelFr: "Mensuel", labelEn: "Monthly", labelAr: "شهري", tone: "accent" },
  yearly: { labelFr: "Annuel", labelEn: "Yearly", labelAr: "سنوي", tone: "success" },
};

/** Suffix used when displaying a plan price, e.g. "/ jour". */
export const SUBSCRIPTION_PERIOD_SUFFIX: Record<SubscriptionPeriod, string> = {
  daily: "jour",
  monthly: "mois",
  yearly: "an",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  orange_money: "Orange Money",
  moov_money: "Moov Money",
  mtn_momo: "MTN MoMo",
  wave: "Wave",
  free_money: "Free Money",
  airtel_money: "Airtel Money",
  mpesa: "M-Pesa",
  bank_card: "Carte bancaire",
  other: "Autre",
};
