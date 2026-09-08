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
  tone: BadgeTone;
}

export const EVENT_STATUS: Record<EventStatus, StatusMeta> = {
  draft: { labelFr: "Brouillon", labelEn: "Draft", tone: "neutral" },
  pending: { labelFr: "En attente", labelEn: "Pending", tone: "warning" },
  published: { labelFr: "Publié", labelEn: "Published", tone: "success" },
  upcoming: { labelFr: "À venir", labelEn: "Upcoming", tone: "info" },
  ongoing: { labelFr: "En cours", labelEn: "Ongoing", tone: "accent" },
  completed: { labelFr: "Terminé", labelEn: "Completed", tone: "info" },
  cancelled: { labelFr: "Annulé", labelEn: "Cancelled", tone: "error" },
  rejected: { labelFr: "Rejeté", labelEn: "Rejected", tone: "error" },
};

export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  pending: { labelFr: "En attente", labelEn: "Pending", tone: "warning" },
  paid: { labelFr: "Payé", labelEn: "Paid", tone: "success" },
  failed: { labelFr: "Échoué", labelEn: "Failed", tone: "error" },
  cancelled: { labelFr: "Annulé", labelEn: "Cancelled", tone: "neutral" },
  refunded: { labelFr: "Remboursé", labelEn: "Refunded", tone: "info" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  pending: { labelFr: "En attente", labelEn: "Pending", tone: "warning" },
  successful: { labelFr: "Réussi", labelEn: "Successful", tone: "success" },
  failed: { labelFr: "Échoué", labelEn: "Failed", tone: "error" },
  refunded: { labelFr: "Remboursé", labelEn: "Refunded", tone: "info" },
};

export const LICENSE_STATUS: Record<LicenseStatus, StatusMeta> = {
  active: { labelFr: "Active", labelEn: "Active", tone: "success" },
  expiring_soon: { labelFr: "Expire bientôt", labelEn: "Expiring soon", tone: "warning" },
  expired: { labelFr: "Expirée", labelEn: "Expired", tone: "error" },
  suspended: { labelFr: "Suspendue", labelEn: "Suspended", tone: "neutral" },
};

export const ENTITY_STATUS: Record<EntityStatus, StatusMeta> = {
  active: { labelFr: "Actif", labelEn: "Active", tone: "success" },
  suspended: { labelFr: "Suspendu", labelEn: "Suspended", tone: "error" },
  pending: { labelFr: "En attente", labelEn: "Pending", tone: "warning" },
};

export const TICKET_STATUS: Record<TicketStatus, StatusMeta> = {
  on_sale: { labelFr: "En vente", labelEn: "On sale", tone: "success" },
  sold_out: { labelFr: "Épuisé", labelEn: "Sold out", tone: "error" },
  paused: { labelFr: "En pause", labelEn: "Paused", tone: "warning" },
  ended: { labelFr: "Terminé", labelEn: "Ended", tone: "neutral" },
};

export const PROMOTION_STATUS: Record<PromotionStatus, StatusMeta> = {
  active: { labelFr: "Active", labelEn: "Active", tone: "success" },
  scheduled: { labelFr: "Programmée", labelEn: "Scheduled", tone: "info" },
  ended: { labelFr: "Terminée", labelEn: "Ended", tone: "neutral" },
  draft: { labelFr: "Brouillon", labelEn: "Draft", tone: "neutral" },
};

export const SUBSCRIPTION_STATUS: Record<SubscriptionStatus, StatusMeta> = {
  active: { labelFr: "Actif", labelEn: "Active", tone: "success" },
  expired: { labelFr: "Expiré", labelEn: "Expired", tone: "error" },
  suspended: { labelFr: "Suspendu", labelEn: "Suspended", tone: "neutral" },
};

export const PLAN_STATUS: Record<PlanStatus, StatusMeta> = {
  active: { labelFr: "Actif", labelEn: "Active", tone: "success" },
  inactive: { labelFr: "Inactif", labelEn: "Inactive", tone: "neutral" },
};

export const SUBSCRIPTION_PERIOD: Record<SubscriptionPeriod, StatusMeta> = {
  daily: { labelFr: "Journalier", labelEn: "Daily", tone: "info" },
  monthly: { labelFr: "Mensuel", labelEn: "Monthly", tone: "accent" },
  yearly: { labelFr: "Annuel", labelEn: "Yearly", tone: "success" },
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
  bank_card: "Carte bancaire",
  other: "Autre",
};
