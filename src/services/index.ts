import { mockResolve } from "@/api/client";
import * as db from "@/mocks/data";
import * as analytics from "@/mocks/analytics";
import { applyFilters, applySearch, applySort, paginate, type QueryParams } from "./helpers";
import type {
  AdminAccount,
  Article,
  Category,
  EndUser,
  EntityStatus,
  EventItem,
  EventType,
  License,
  NotificationCampaign,
  Order,
  Organization,
  OrgType,
  Payment,
  Promotion,
  Subscription,
  SubscriptionPayment,
  SubscriptionPeriod,
  SubscriptionPlan,
  SubscriptionPromotion,
  SubscriptionStatus,
  TicketType,
} from "@/types";

// ============================================================
// Input shapes for mutations
// ============================================================
export interface OrganizationInput {
  name: string;
  categoryId: string;
  type?: OrgType;
  countryCode: string;
  region: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  adminName?: string;
  loginEmail?: string;
  password?: string;
  status?: EntityStatus;
  logo?: string;
}

export interface PlanInput {
  name: string;
  period: SubscriptionPeriod;
  price: number;
  description?: string;
  features?: string[];
  status?: SubscriptionPlan["status"];
}

export interface SubscriptionPromotionInput {
  name: string;
  period: SubscriptionPeriod;
  discountType: "percent" | "fixed";
  discountPercent?: number;
  promoPrice?: number;
  startDate: string;
  endDate: string;
  status?: SubscriptionPromotion["status"];
}

// ============================================================
// Subscription helpers
// ============================================================
/** Derive the live status of a subscription from its end date. */
function computeStatus(sub: Subscription): SubscriptionStatus {
  if (sub.status === "suspended") return "suspended";
  return new Date(sub.endDate).getTime() < Date.now() ? "expired" : "active";
}

function withComputedStatus(sub: Subscription): Subscription {
  return { ...sub, status: computeStatus(sub) };
}

/** Find the currently-active promotion for a plan's period, if any. */
function activePromotionForPeriod(period: SubscriptionPeriod): SubscriptionPromotion | undefined {
  const now = Date.now();
  return db.subscriptionPromotions.find(
    (p) =>
      p.period === period &&
      p.status === "active" &&
      new Date(p.startDate).getTime() <= now &&
      new Date(p.endDate).getTime() >= now
  );
}

/** Apply an active promotion (if any) to a plan's base price. */
function effectivePlanPrice(plan: SubscriptionPlan): { price: number; promotion?: SubscriptionPromotion } {
  const promo = activePromotionForPeriod(plan.period);
  if (!promo) return { price: plan.price };
  if (promo.discountType === "fixed" && promo.promoPrice != null) {
    return { price: promo.promoPrice, promotion: promo };
  }
  if (promo.discountType === "percent" && promo.discountPercent != null) {
    return { price: Math.round(plan.price * (1 - promo.discountPercent / 100)), promotion: promo };
  }
  return { price: plan.price };
}

// ============================================================
// Domain services — API-ready. Each returns a Promise.
// Replace mockResolve(...) with request(...) when backend ready.
// ============================================================

export const eventService = {
  list(params: QueryParams = {}) {
    let items = db.events;
    items = applySearch(items, params.search, ["name", "organizationName", "city"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    return mockResolve(db.events.find((e) => e.id === id) ?? null);
  },
  ticketsFor(eventId: string) {
    return mockResolve(db.ticketTypes.filter((t) => t.eventId === eventId));
  },
  ordersFor(eventId: string) {
    return mockResolve(db.orders.filter((o) => o.eventId === eventId).slice(0, 8));
  },
  byOrg(orgId: string) {
    return mockResolve(db.events.filter((e) => e.organizationId === orgId));
  },
};

export const ticketService = {
  list(params: QueryParams = {}) {
    let items = db.ticketTypes;
    items = applySearch(items, params.search, ["name"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 12));
  },
  all() {
    return mockResolve(db.ticketTypes);
  },
};

export const orderService = {
  list(params: QueryParams = {}) {
    let items = db.orders;
    items = applySearch(items, params.search, ["reference", "customerName", "eventName"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    return mockResolve(db.orders.find((o) => o.id === id) ?? null);
  },
  byOrg(orgId: string, params: QueryParams = {}) {
    let items = db.orders.filter((o) => o.organizationId === orgId);
    items = applySearch(items, params.search, ["reference", "customerName", "eventName"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
};

export const userService = {
  list(params: QueryParams = {}) {
    let items = db.endUsers;
    items = applySearch(items, params.search, ["name", "email", "phone"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    return mockResolve(db.endUsers.find((u) => u.id === id) ?? null);
  },
};

export const adminService = {
  list(params: QueryParams = {}) {
    let items = db.admins;
    items = applySearch(items, params.search, ["name", "organizationName", "email"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy ?? "revenue", params.sortDir ?? "desc");
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    return mockResolve(db.admins.find((a) => a.id === id) ?? null);
  },
};

export const organizationService = {
  list(params: QueryParams = {}) {
    let items = db.organizations;
    items = applySearch(items, params.search, ["name", "email", "city"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    return mockResolve(db.organizations.find((o) => o.id === id) ?? null);
  },
  create(input: OrganizationInput) {
    const id = `org-${db.organizations.length + 1}-${Date.now().toString(36)}`;
    const org: Organization = {
      id,
      name: input.name,
      categoryId: input.categoryId,
      type: input.type ?? "private",
      countryCode: input.countryCode,
      region: input.region,
      city: input.city,
      address: input.address,
      phone: input.phone,
      email: input.email,
      adminName: input.adminName ?? input.name,
      adminId: `adm-${id}`,
      licenseId: "",
      status: input.status ?? "active",
      eventsCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      logo: input.logo ?? "",
      loginEmail: input.loginEmail ?? input.email,
      password: input.password,
    };
    db.organizations.push(org);
    return mockResolve(org);
  },
  update(id: string, patch: Partial<OrganizationInput>) {
    const org = db.organizations.find((o) => o.id === id);
    if (!org) return mockResolve(null);
    Object.assign(org, patch);
    return mockResolve(org);
  },
};

export const paymentService = {
  list(params: QueryParams = {}) {
    let items = db.payments;
    items = applySearch(items, params.search, ["transactionId", "orderRef", "customerName"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
};

export const licenseService = {
  list(params: QueryParams = {}) {
    let items = db.licenses;
    items = applySearch(items, params.search, ["organizationName", "type"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
};

export const categoryService = {
  all() {
    return mockResolve(db.categories);
  },
};

export const eventTypeService = {
  all() {
    return mockResolve(db.eventTypes);
  },
};

export const promotionService = {
  list(params: QueryParams = {}) {
    let items = db.promotions;
    items = applySearch(items, params.search, ["name", "code"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  byOrg(orgId: string) {
    return mockResolve(db.promotions.filter((p) => p.organizationId === orgId));
  },
};

// ============================================================
// Subscriptions
// ============================================================

export const planService = {
  list(params: QueryParams = {}) {
    let items = db.subscriptionPlans;
    items = applySearch(items, params.search, ["name", "description"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 20));
  },
  all() {
    return mockResolve(db.subscriptionPlans);
  },
  get(id: string) {
    return mockResolve(db.subscriptionPlans.find((p) => p.id === id) ?? null);
  },
  create(input: PlanInput) {
    const plan: SubscriptionPlan = {
      id: `plan-${Date.now().toString(36)}`,
      name: input.name,
      period: input.period,
      price: input.price,
      description: input.description ?? "",
      features: input.features ?? [],
      status: input.status ?? "active",
      createdAt: new Date().toISOString(),
    };
    db.subscriptionPlans.push(plan);
    return mockResolve(plan);
  },
  update(id: string, patch: Partial<PlanInput>) {
    const plan = db.subscriptionPlans.find((p) => p.id === id);
    if (!plan) return mockResolve(null);
    Object.assign(plan, patch);
    return mockResolve(plan);
  },
  setStatus(id: string, status: SubscriptionPlan["status"]) {
    const plan = db.subscriptionPlans.find((p) => p.id === id);
    if (!plan) return mockResolve(null);
    plan.status = status;
    return mockResolve(plan);
  },
  remove(id: string) {
    const idx = db.subscriptionPlans.findIndex((p) => p.id === id);
    if (idx >= 0) db.subscriptionPlans.splice(idx, 1);
    return mockResolve({ ok: true });
  },
  /** Effective price of a plan today, applying any active matching promotion. */
  effectivePrice(plan: SubscriptionPlan) {
    return effectivePlanPrice(plan);
  },
};

export const subscriptionService = {
  list(params: QueryParams = {}) {
    let items = db.subscriptions.map(withComputedStatus);
    items = applySearch(items, params.search, ["organizationName", "planName"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    const sub = db.subscriptions.find((s) => s.id === id);
    return mockResolve(sub ? withComputedStatus(sub) : null);
  },
  byOrg(orgId: string) {
    const sub = db.subscriptions.find((s) => s.organizationId === orgId);
    return mockResolve(sub ? withComputedStatus(sub) : null);
  },
  paymentsFor(subscriptionId: string) {
    return mockResolve(
      db.subscriptionPayments
        .filter((p) => p.subscriptionId === subscriptionId)
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    );
  },
  paymentsForOrg(orgId: string) {
    return mockResolve(
      db.subscriptionPayments
        .filter((p) => p.organizationId === orgId)
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    );
  },
  /**
   * Whether an organization may create new publications.
   * Blocked when its subscription is expired or suspended.
   */
  canPublish(orgId: string) {
    const sub = db.subscriptions.find((s) => s.organizationId === orgId);
    const status = sub ? computeStatus(sub) : "expired";
    return mockResolve({ allowed: status === "active", status });
  },
};

export const subscriptionPromotionService = {
  list(params: QueryParams = {}) {
    let items = db.subscriptionPromotions;
    items = applySearch(items, params.search, ["name"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 20));
  },
  all() {
    return mockResolve(db.subscriptionPromotions);
  },
  create(input: SubscriptionPromotionInput) {
    const promo: SubscriptionPromotion = {
      id: `spromo-${Date.now().toString(36)}`,
      name: input.name,
      period: input.period,
      discountType: input.discountType,
      discountPercent: input.discountType === "percent" ? input.discountPercent : undefined,
      promoPrice: input.discountType === "fixed" ? input.promoPrice : undefined,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status ?? "scheduled",
      createdAt: new Date().toISOString(),
    };
    db.subscriptionPromotions.push(promo);
    return mockResolve(promo);
  },
  update(id: string, patch: Partial<SubscriptionPromotion>) {
    const promo = db.subscriptionPromotions.find((p) => p.id === id);
    if (!promo) return mockResolve(null);
    Object.assign(promo, patch);
    return mockResolve(promo);
  },
  setStatus(id: string, status: SubscriptionPromotion["status"]) {
    const promo = db.subscriptionPromotions.find((p) => p.id === id);
    if (!promo) return mockResolve(null);
    promo.status = status;
    return mockResolve(promo);
  },
  remove(id: string) {
    const idx = db.subscriptionPromotions.findIndex((p) => p.id === id);
    if (idx >= 0) db.subscriptionPromotions.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};

export const notificationService = {
  all() {
    return mockResolve(db.notifications);
  },
};

export const articleService = {
  all() {
    return mockResolve(db.articles);
  },
};

export const analyticsService = {
  revenueOverTime: () => mockResolve(analytics.revenueOverTime),
  ticketsOverTime: () => mockResolve(analytics.ticketsOverTime),
  eventsBreakdown: () => mockResolve(analytics.eventsBreakdown),
  usersByRegion: () => mockResolve(analytics.usersByRegion),
  revenueByCategory: () => mockResolve(analytics.revenueByCategory),
  ticketDistribution: () => mockResolve(analytics.ticketDistribution),
  topOrganizations: () => mockResolve(analytics.topOrganizations),
  topEvents: () => mockResolve(analytics.topEvents),
};

// --- Dashboard KPI aggregation ---
export const dashboardService = {
  superAdminKpis() {
    const totalRevenue = db.organizations.reduce((s, o) => s + o.revenue, 0);
    const ticketsSold = db.events.reduce((s, e) => s + e.ticketsSold, 0);
    return mockResolve({
      totalUsers: db.endUsers.length * 312, // scaled for realism
      totalAdmins: db.admins.length,
      totalEvents: db.events.length,
      ticketsSold,
      totalRevenue,
      commission: Math.round(totalRevenue * 0.12),
      activeLicenses: db.licenses.filter((l) => l.status === "active").length,
      pendingEvents: db.events.filter((e) => e.status === "pending").length,
    });
  },
  /** KPIs focused on companies, subscriptions and promotions. */
  subscriptionKpis() {
    const subs = db.subscriptions.map(withComputedStatus);
    const now = Date.now();
    const soon = now + 30 * 24 * 60 * 60 * 1000;
    const expiringSoon = subs.filter(
      (s) => s.status === "active" && new Date(s.endDate).getTime() <= soon
    ).length;
    const subscriptionRevenue = db.subscriptionPayments
      .filter((p) => p.status === "successful")
      .reduce((s, p) => s + p.amount, 0);
    const activePromotions = db.subscriptionPromotions.filter((p) => p.status === "active").length;
    return mockResolve({
      totalCompanies: db.organizations.length,
      activeSubscriptions: subs.filter((s) => s.status === "active").length,
      expiredSubscriptions: subs.filter((s) => s.status === "expired").length,
      expiringSoon,
      subscriptionRevenue,
      activePromotions,
      // publications (events) created per company
      publicationsByCompany: db.organizations.map((o) => ({
        organizationId: o.id,
        organizationName: o.name,
        publications: db.events.filter((e) => e.organizationId === o.id).length,
      })),
    });
  },
  adminKpis(orgId: string) {
    const orgEvents = db.events.filter((e) => e.organizationId === orgId);
    const orgOrders = db.orders.filter((o) => o.organizationId === orgId);
    const revenue = orgEvents.reduce((s, e) => s + e.revenue, 0);
    const ticketsSold = orgEvents.reduce((s, e) => s + e.ticketsSold, 0);
    const ticketsTotal = orgEvents.reduce((s, e) => s + e.ticketsTotal, 0);
    return mockResolve({
      myEvents: orgEvents.length,
      ticketsSold,
      revenue,
      pendingOrders: orgOrders.filter((o) => o.status === "pending").length,
      upcomingEvents: orgEvents.filter((e) => e.status === "upcoming").length,
      ticketsAvailable: ticketsTotal - ticketsSold,
    });
  },
};

export type {
  QueryParams,
} from "./helpers";
export type {
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
};
