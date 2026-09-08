import type {
  AdminAccount,
  Article,
  Category,
  EndUser,
  EventItem,
  EventType,
  License,
  NotificationCampaign,
  Order,
  Organization,
  Payment,
  Promotion,
  Subscription,
  SubscriptionPayment,
  SubscriptionPlan,
  SubscriptionPromotion,
  TicketType,
} from "@/types";

// ============================================================
// Coherent mock dataset for Horizon360 (Sahel / West Africa)
// ============================================================

export const REGIONS = [
  "Bamako",
  "Sikasso",
  "Ségou",
  "Kayes",
  "Mopti",
  "Koulikoro",
  "Gao",
  "Tombouctou",
];

export const categories: Category[] = [
  { id: "cat-hotel", name: "Hôtel", description: "Établissements hôteliers", icon: "hotel", organizationsCount: 6, eventsCount: 14 },
  { id: "cat-resto", name: "Restaurant", description: "Restaurants & gastronomie", icon: "utensils", organizationsCount: 9, eventsCount: 21 },
  { id: "cat-concert", name: "Concert", description: "Salles & production musicale", icon: "music", organizationsCount: 7, eventsCount: 33 },
  { id: "cat-club", name: "Club", description: "Clubs & vie nocturne", icon: "disc", organizationsCount: 5, eventsCount: 18 },
  { id: "cat-school", name: "École / Université", description: "Établissements d'enseignement", icon: "graduation-cap", organizationsCount: 4, eventsCount: 9 },
  { id: "cat-cinema", name: "Cinéma", description: "Salles de cinéma", icon: "film", organizationsCount: 3, eventsCount: 12 },
  { id: "cat-gov", name: "Gouvernement", description: "Institutions publiques", icon: "landmark", organizationsCount: 2, eventsCount: 6 },
];

export const eventTypes: EventType[] = [
  { id: "et-cultural", name: "Culturel", description: "Événements culturels", eventsCount: 24 },
  { id: "et-buffet", name: "Buffet", description: "Dîners et buffets", eventsCount: 11 },
  { id: "et-festival", name: "Festival", description: "Festivals", eventsCount: 18 },
  { id: "et-conf", name: "Conférence", description: "Conférences & sommets", eventsCount: 15 },
  { id: "et-sport", name: "Sport", description: "Événements sportifs", eventsCount: 13 },
  { id: "et-expo", name: "Exposition", description: "Expositions", eventsCount: 8 },
  { id: "et-theatre", name: "Théâtre", description: "Théâtre", eventsCount: 6 },
  { id: "et-film", name: "Film", description: "Projections", eventsCount: 9 },
  { id: "et-workshop", name: "Atelier d'art", description: "Ateliers créatifs", eventsCount: 5 },
  { id: "et-tourism", name: "Tourisme", description: "Tourisme & découverte", eventsCount: 4 },
];

export const organizations: Organization[] = [
  { id: "org-1", name: "Bamako Events", categoryId: "cat-concert", type: "private", region: "Bamako", city: "Bamako", address: "Av. de l'Indépendance", phone: "+223 70 12 34 56", email: "contact@bamakoevents.ml", adminName: "Aïcha Traoré", adminId: "adm-1", licenseId: "lic-1", status: "active", eventsCount: 12, revenue: 48_500_000, createdAt: "2024-02-10T09:00:00Z", logo: "" },
  { id: "org-2", name: "Mali Culture Group", categoryId: "cat-gov", type: "public", region: "Ségou", city: "Ségou", address: "Rue du Fleuve", phone: "+223 76 22 11 09", email: "info@maliculture.ml", adminName: "Modibo Keïta", adminId: "adm-2", licenseId: "lic-2", status: "active", eventsCount: 8, revenue: 22_300_000, createdAt: "2024-03-01T09:00:00Z", logo: "" },
  { id: "org-3", name: "Afrobeat Productions", categoryId: "cat-concert", type: "private", region: "Bamako", city: "Bamako", address: "ACI 2000", phone: "+223 65 88 77 66", email: "hello@afrobeatprod.ml", adminName: "Fatoumata Diarra", adminId: "adm-3", licenseId: "lic-3", status: "active", eventsCount: 15, revenue: 71_200_000, createdAt: "2023-11-15T09:00:00Z", logo: "" },
  { id: "org-4", name: "Sahel Sports", categoryId: "cat-school", type: "private", region: "Sikasso", city: "Sikasso", address: "Quartier Hamdallaye", phone: "+223 78 44 33 22", email: "contact@sahelsports.ml", adminName: "Oumar Cissé", adminId: "adm-4", licenseId: "lic-4", status: "active", eventsCount: 6, revenue: 14_900_000, createdAt: "2024-05-20T09:00:00Z", logo: "" },
  { id: "org-5", name: "Africa Business Network", categoryId: "cat-hotel", type: "private", region: "Bamako", city: "Bamako", address: "Hippodrome", phone: "+223 69 55 44 11", email: "team@abnetwork.africa", adminName: "Kadiatou Sylla", adminId: "adm-5", licenseId: "lic-5", status: "active", eventsCount: 9, revenue: 35_600_000, createdAt: "2024-01-08T09:00:00Z", logo: "" },
  { id: "org-6", name: "Niger River Cinéma", categoryId: "cat-cinema", type: "private", region: "Mopti", city: "Mopti", address: "Bord du fleuve", phone: "+223 90 12 45 78", email: "contact@nrcinema.ml", adminName: "Ibrahim Touré", adminId: "adm-6", licenseId: "lic-6", status: "suspended", eventsCount: 4, revenue: 8_200_000, createdAt: "2024-06-12T09:00:00Z", logo: "" },
];

export const admins: AdminAccount[] = organizations.map((org, i) => {
  const licenseTypes = ["Premium", "Business", "Standard", "Standard", "Business", "Standard"];
  const licenseStatuses = ["active", "active", "active", "expiring_soon", "active", "expired"] as const;
  return {
    id: org.adminId,
    name: org.adminName,
    email: org.email,
    phone: org.phone,
    organizationId: org.id,
    organizationName: org.name,
    categoryId: org.categoryId,
    region: org.region,
    licenseType: licenseTypes[i],
    licenseStatus: licenseStatuses[i],
    eventsCount: org.eventsCount,
    revenue: org.revenue,
    status: org.status,
    createdAt: org.createdAt,
  };
});

export const licenses: License[] = organizations.map((org, i) => {
  const types = ["Premium", "Business", "Standard", "Standard", "Business", "Standard"];
  const statuses = ["active", "active", "active", "expiring_soon", "active", "expired"] as const;
  const ends = [
    "2026-11-30T00:00:00Z",
    "2026-10-15T00:00:00Z",
    "2027-01-20T00:00:00Z",
    "2026-09-25T00:00:00Z",
    "2026-12-31T00:00:00Z",
    "2026-07-10T00:00:00Z",
  ];
  return {
    id: org.licenseId,
    organizationId: org.id,
    organizationName: org.name,
    type: types[i],
    startDate: org.createdAt,
    endDate: ends[i],
    status: statuses[i],
    revenue: org.revenue,
  };
});

const EVENT_NAMES = [
  "Bamako Music Night",
  "Afrobeat Festival",
  "African Fashion Week",
  "Mali Basketball Championship",
  "African Business Summit",
  "Bamako Food Festival",
  "Nuit du Wassoulou",
  "Ségou' Art Festival",
  "Sahel Startup Forum",
  "Ciné Plein Air Mopti",
  "Gala de la Culture Mandingue",
  "Tournoi Inter-Universités",
];

const EVENT_STATUSES = [
  "published", "ongoing", "upcoming", "completed", "pending",
  "published", "draft", "published", "upcoming", "cancelled",
  "completed", "rejected",
] as const;

export const events: EventItem[] = EVENT_NAMES.map((name, i) => {
  const org = organizations[i % organizations.length];
  const ticketsTotal = 500 + (i % 5) * 350;
  const sold = Math.round(ticketsTotal * (0.35 + (i % 5) * 0.13));
  const avgPrice = 12_000 + (i % 4) * 6_000;
  const revenue = sold * avgPrice;
  const start = new Date(2026, 8 + (i % 4), 5 + i, 19, 0);
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
  return {
    id: `evt-${i + 1}`,
    name,
    description:
      "Un événement phare qui rassemble le meilleur de la scène culturelle et créative africaine, dans une ambiance premium et festive.",
    organizationId: org.id,
    organizationName: org.name,
    categoryId: org.categoryId,
    eventTypeId: eventTypes[i % eventTypes.length].id,
    region: org.region,
    city: org.city,
    address: `${org.address}, ${org.city}`,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    status: EVENT_STATUSES[i],
    coverImage: "",
    ticketsSold: sold,
    ticketsTotal,
    revenue,
    ordersCount: Math.round(sold / 2.3),
    createdAt: new Date(2026, 5 + (i % 3), 1 + i).toISOString(),
  };
});

export const ticketTypes: TicketType[] = events.flatMap((evt, i) => {
  const tiers = [
    { name: "VIP", price: 25_000, share: 0.2 },
    { name: "Standard", price: 12_000, share: 0.5 },
    { name: "Early Bird", price: 8_000, share: 0.3 },
  ];
  return tiers.map((tier, j) => {
    const quantity = Math.round(evt.ticketsTotal * tier.share);
    const sold = Math.min(quantity, Math.round(evt.ticketsSold * tier.share));
    const status =
      sold >= quantity ? "sold_out" : evt.status === "completed" ? "ended" : "on_sale";
    return {
      id: `tkt-${i + 1}-${j + 1}`,
      eventId: evt.id,
      name: tier.name,
      price: tier.price,
      quantity,
      sold,
      saleStart: evt.createdAt,
      saleEnd: evt.startDate,
      status: status as TicketType["status"],
    };
  });
});

const FIRST = ["Aminata", "Sekou", "Mariam", "Bakary", "Fanta", "Adama", "Salif", "Rokia", "Youssouf", "Nana"];
const LAST = ["Coulibaly", "Diallo", "Konaté", "Sangaré", "Maïga", "Sidibé", "Berthé", "Doumbia", "Traoré", "Kanté"];

export const endUsers: EndUser[] = Array.from({ length: 40 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
  const purchased = ((i * 7) % 11) + 1;
  const statuses = ["active", "active", "active", "suspended", "pending"] as const;
  return {
    id: `usr-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@mail.ml`,
    phone: `+223 ${70 + (i % 9)} ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")} ${String(30 + i).padStart(2, "0")}`,
    region: REGIONS[i % REGIONS.length],
    ticketsPurchased: purchased,
    totalSpent: purchased * (9_000 + (i % 4) * 4_500),
    status: statuses[i % statuses.length],
    createdAt: new Date(2025, i % 12, 1 + (i % 27)).toISOString(),
  };
});

const PAYMENT_METHODS = ["orange_money", "moov_money", "bank_card", "other"] as const;
const ORDER_STATUSES = ["paid", "paid", "paid", "pending", "failed", "refunded", "cancelled"] as const;

export const orders: Order[] = Array.from({ length: 60 }, (_, i) => {
  const evt = events[i % events.length];
  const user = endUsers[i % endUsers.length];
  const tickets = ((i * 2) % 4) + 1;
  const amount = tickets * (10_000 + (i % 5) * 3_000);
  const orderStatus = ORDER_STATUSES[i % ORDER_STATUSES.length];
  const paymentStatus =
    orderStatus === "paid" ? "successful"
    : orderStatus === "failed" ? "failed"
    : orderStatus === "refunded" ? "refunded"
    : "pending";
  return {
    id: `ord-${i + 1}`,
    reference: `H360-${String(10240 + i)}`,
    customerName: user.name,
    customerEmail: user.email,
    eventId: evt.id,
    eventName: evt.name,
    organizationId: evt.organizationId,
    ticketsCount: tickets,
    amount,
    paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
    paymentStatus,
    status: orderStatus,
    createdAt: new Date(2026, 7 + (i % 2), 1 + (i % 27), 10 + (i % 10), (i * 7) % 60).toISOString(),
    ticketCodes: Array.from({ length: tickets }, (_, k) => `TCK-${10240 + i}-${k + 1}`),
  };
});

export const payments: Payment[] = orders
  .filter((o) => o.paymentStatus !== "pending")
  .map((o, i) => {
    const org = organizations.find((org) => org.id === o.organizationId)!;
    return {
      id: `pay-${i + 1}`,
      transactionId: `TX-${String(880340 + i)}`,
      orderId: o.id,
      orderRef: o.reference,
      customerName: o.customerName,
      organizationId: o.organizationId,
      organizationName: org?.name ?? "—",
      amount: o.amount,
      method: o.paymentMethod,
      status: o.paymentStatus,
      createdAt: o.createdAt,
    };
  });

export const promotions: Promotion[] = [
  { id: "promo-1", name: "Fête de l'Indépendance", code: "INDEP26", discountPercent: 20, startDate: "2026-09-15T00:00:00Z", endDate: "2026-09-25T00:00:00Z", applicableEvents: "Tous les concerts", targetAudience: "Tous les utilisateurs", status: "active", usageCount: 342, organizationId: "org-3" },
  { id: "promo-2", name: "Early Bird Festival", code: "EARLY10", discountPercent: 10, startDate: "2026-10-01T00:00:00Z", endDate: "2026-10-20T00:00:00Z", applicableEvents: "Afrobeat Festival", targetAudience: "Bamako", status: "scheduled", usageCount: 0, organizationId: "org-3" },
  { id: "promo-3", name: "Ramadan Special", code: "RAMADAN26", discountPercent: 15, startDate: "2026-03-01T00:00:00Z", endDate: "2026-03-30T00:00:00Z", applicableEvents: "Buffets", targetAudience: "Tous les utilisateurs", status: "ended", usageCount: 891 },
  { id: "promo-4", name: "Étudiants", code: "STUDENT25", discountPercent: 25, startDate: "2026-09-01T00:00:00Z", endDate: "2026-12-31T00:00:00Z", applicableEvents: "Événements sportifs", targetAudience: "Étudiants", status: "active", usageCount: 156, organizationId: "org-4" },
  { id: "promo-5", name: "Lancement plateforme", code: "WELCOME", discountPercent: 30, startDate: "2026-06-01T00:00:00Z", endDate: "2026-06-30T00:00:00Z", applicableEvents: "Tous", targetAudience: "Nouveaux utilisateurs", status: "draft", usageCount: 0 },
];

// ============================================================
// Subscriptions — configurable plans, promotions & history
// ============================================================

// Give each company login credentials for its Admin space.
organizations.forEach((org) => {
  org.loginEmail = org.email;
  org.password = "jigievent";
});

/** Default subscription plans. Prices are fully editable from the Super Admin UI. */
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "plan-daily",
    name: "Journalier",
    period: "daily",
    price: 5_000,
    description: "Accès complet à la publication pour 24 heures.",
    features: ["Publications illimitées pendant 24h", "Ajout d'images et médias", "Publication d'événements"],
    status: "active",
    createdAt: "2026-01-01T09:00:00Z",
  },
  {
    id: "plan-monthly",
    name: "Mensuel",
    period: "monthly",
    price: 50_000,
    description: "Idéal pour les entreprises actives tout au long du mois.",
    features: ["Publications illimitées", "Ajout d'images et médias", "Publication d'événements", "Statistiques de base"],
    status: "active",
    createdAt: "2026-01-01T09:00:00Z",
  },
  {
    id: "plan-yearly",
    name: "Annuel",
    period: "yearly",
    price: 1_000_000,
    description: "La meilleure valeur pour une présence continue sur l'année.",
    features: ["Publications illimitées", "Ajout d'images et médias", "Publication d'événements", "Statistiques avancées", "Support prioritaire"],
    status: "active",
    createdAt: "2026-01-01T09:00:00Z",
  },
];

export const subscriptionPromotions: SubscriptionPromotion[] = [
  {
    id: "spromo-1",
    name: "Promo de Décembre",
    period: "monthly",
    discountType: "fixed",
    promoPrice: 40_000,
    startDate: "2026-12-01T00:00:00Z",
    endDate: "2026-12-15T00:00:00Z",
    status: "scheduled",
    createdAt: "2026-09-01T09:00:00Z",
  },
  {
    id: "spromo-2",
    name: "Rentrée -20%",
    period: "yearly",
    discountType: "percent",
    discountPercent: 20,
    startDate: "2026-09-01T00:00:00Z",
    endDate: "2026-09-30T00:00:00Z",
    status: "active",
    createdAt: "2026-08-15T09:00:00Z",
  },
  {
    id: "spromo-3",
    name: "Journée découverte",
    period: "daily",
    discountType: "percent",
    discountPercent: 50,
    startDate: "2026-05-01T00:00:00Z",
    endDate: "2026-05-31T00:00:00Z",
    status: "ended",
    createdAt: "2026-04-15T09:00:00Z",
  },
];

const PLAN_BY_ORG = ["plan-yearly", "plan-monthly", "plan-yearly", "plan-monthly", "plan-yearly", "plan-monthly"] as const;
// Subscription end dates chosen to exercise active / expiring-soon / expired states.
const SUB_END = [
  "2027-06-30T00:00:00Z", // active (far)
  "2026-09-25T00:00:00Z", // expiring soon (~17 days from 2026-09-08)
  "2027-02-20T00:00:00Z", // active
  "2026-09-15T00:00:00Z", // expiring soon
  "2026-12-31T00:00:00Z", // active
  "2026-07-10T00:00:00Z", // expired
];

export const subscriptions: Subscription[] = organizations.map((org, i) => {
  const planId = PLAN_BY_ORG[i];
  const plan = subscriptionPlans.find((p) => p.id === planId)!;
  const endDate = SUB_END[i];
  const expired = new Date(endDate).getTime() < Date.now();
  const status = org.status === "suspended" ? "suspended" : expired ? "expired" : "active";
  // org-2 subscribed during the yearly promo -> paid the promo price.
  const appliedPromotionId = i === 4 ? "spromo-2" : undefined;
  const pricePaid = appliedPromotionId ? Math.round(plan.price * 0.8) : plan.price;
  return {
    id: `sub-${i + 1}`,
    organizationId: org.id,
    organizationName: org.name,
    planId: plan.id,
    planName: plan.name,
    period: plan.period,
    pricePaid,
    startDate: org.createdAt,
    endDate,
    status,
    appliedPromotionId,
    createdAt: org.createdAt,
  };
});

// Payment history: an initial payment + one renewal for a few companies.
export const subscriptionPayments: SubscriptionPayment[] = subscriptions.flatMap((sub, i) => {
  const rows: SubscriptionPayment[] = [
    {
      id: `spay-${i + 1}-1`,
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      organizationName: sub.organizationName,
      planName: sub.planName,
      period: sub.period,
      amount: sub.pricePaid,
      method: "orange_money",
      status: "successful",
      promotionName: sub.appliedPromotionId ? "Rentrée -20%" : undefined,
      paidAt: sub.startDate,
    },
  ];
  // Add a renewal for even-indexed companies.
  if (i % 2 === 0) {
    const renewalDate = new Date(new Date(sub.startDate).getTime() + 90 * 24 * 60 * 60 * 1000);
    rows.push({
      id: `spay-${i + 1}-2`,
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      organizationName: sub.organizationName,
      planName: sub.planName,
      period: sub.period,
      amount: sub.pricePaid,
      method: i % 4 === 0 ? "moov_money" : "bank_card",
      status: "successful",
      paidAt: renewalDate.toISOString(),
    });
  }
  return rows;
});

export const notifications: NotificationCampaign[] = [
  { id: "ntf-1", title: "Afrobeat Festival — billets en vente", message: "Les billets pour l'Afrobeat Festival sont disponibles !", channel: "push", audience: "Tous les utilisateurs", scheduledAt: "2026-09-10T08:00:00Z", status: "sent", reach: 12_450 },
  { id: "ntf-2", title: "Rappel — événement demain", message: "Votre événement commence demain à 19h.", channel: "sms", audience: "Bamako", scheduledAt: "2026-09-14T18:00:00Z", status: "scheduled", reach: 3_200 },
  { id: "ntf-3", title: "Nouvelle promotion disponible", message: "Profitez de -20% avec le code INDEP26.", channel: "email", audience: "Tous les utilisateurs", scheduledAt: "2026-09-15T09:00:00Z", status: "sent", reach: 18_900 },
  { id: "ntf-4", title: "Maintenance programmée", message: "La plateforme sera indisponible dimanche de 2h à 4h.", channel: "in_app", audience: "Admins", scheduledAt: "2026-09-20T00:00:00Z", status: "draft", reach: 0 },
];

export const articles: Article[] = [
  { id: "art-1", title: "L'essor de la billetterie digitale en Afrique de l'Ouest", cover: "", excerpt: "Comment Horizon360 transforme l'accès aux événements culturels.", author: "Rédaction Horizon360", category: "Actualités", status: "published", publishedDate: "2026-08-20T09:00:00Z", views: 4_210 },
  { id: "art-2", title: "5 festivals à ne pas manquer cette saison", cover: "", excerpt: "Notre sélection des événements incontournables au Mali.", author: "Aïcha Traoré", category: "Blog", status: "published", publishedDate: "2026-08-28T09:00:00Z", views: 2_880 },
  { id: "art-3", title: "Interview : la scène Afrobeat de Bamako", cover: "", excerpt: "Rencontre avec les organisateurs qui font vibrer la capitale.", author: "Fatoumata Diarra", category: "Blog", status: "draft", publishedDate: "2026-09-01T09:00:00Z", views: 0 },
  { id: "art-4", title: "Guide organisateur : réussir son premier événement", cover: "", excerpt: "Les bonnes pratiques pour lancer un événement sur Horizon360.", author: "Rédaction Horizon360", category: "Guide", status: "published", publishedDate: "2026-07-15T09:00:00Z", views: 6_540 },
];

// Auth accounts (for mock login)
export const authAccounts = [
  {
    id: "sa-1",
    name: "Awa Sanogo",
    email: "superadmin@horizon360.africa",
    password: "horizon360",
    role: "SUPER_ADMIN" as const,
    organizationName: "Horizon360",
  },
  {
    id: "adm-1",
    name: "Aïcha Traoré",
    email: "admin@bamakoevents.ml",
    password: "horizon360",
    role: "ADMIN" as const,
    organizationId: "org-1",
    organizationName: "Bamako Events",
  },
];
