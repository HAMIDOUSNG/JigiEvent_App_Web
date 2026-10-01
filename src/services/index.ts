import { mockResolve, apiConfig } from "@/api/client";
import { organizationsRepo } from "@/api/repositories/organizations";
import { plansRepo } from "@/api/repositories/plans";
import { subscriptionPromotionsRepo } from "@/api/repositories/subscriptionPromotions";
import { subscriptionsRepo } from "@/api/repositories/subscriptions";
import { eventsRepo, type TicketTypeWithEvent } from "@/api/repositories/events";
import { ordersRepo } from "@/api/repositories/orders";
import { analyticsRepo } from "@/api/repositories/analytics";
import {
  adminsRepo,
  endUsersRepo,
  paymentsRepo,
  categoriesRepo,
  eventTypesRepo,
  licensesRepo,
  notificationsRepo,
  articlesRepo,
  promotionsRepo,
  type CategoryInput,
  type EventTypeInput,
  type NotificationInput,
  type ArticleInput,
  type PromotionInput,
} from "@/api/repositories/content";
import { storageRepo } from "@/api/repositories/storage";
import * as db from "@/mocks/data";
import * as analytics from "@/mocks/analytics";
import { countryAmountToReference } from "@/constants/exchange";
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

/**
 * Statuts d'événement acceptés par la base (enum `event_status`, migration
 * 0007). Un événement est PUBLIÉ (visible côté mobile) dès que son statut
 * n'est pas `draft`.
 */
export type EventDbStatus = "draft" | "upcoming" | "ongoing" | "past" | "cancelled";

export interface EventInput {
  name: string;
  description?: string;
  organizationId: string;
  categoryId?: string;
  region?: string;
  city?: string;
  address?: string;
  venueName?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  status?: EventDbStatus;
  isFeatured?: boolean;
  isPromoted?: boolean;
}

export interface TicketTypeInput {
  name: string;
  price: number;
  quantity: number;
  maxPerOrder?: number;
  description?: string;
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

/**
 * Trouve la promotion active pour une période, dans une liste donnée.
 * En mode mock, la liste par défaut est celle en mémoire.
 */
function activePromotionForPeriod(
  period: SubscriptionPeriod,
  promotions: SubscriptionPromotion[] = db.subscriptionPromotions
): SubscriptionPromotion | undefined {
  const now = Date.now();
  return promotions.find(
    (p) =>
      p.period === period &&
      p.status === "active" &&
      new Date(p.startDate).getTime() <= now &&
      new Date(p.endDate).getTime() >= now
  );
}

/**
 * Applique une promotion active (si présente) au prix de base d'un plan.
 * Passez `promotions` (récupérées de Supabase) pour un calcul correct en
 * mode réel ; sinon la liste mock en mémoire est utilisée.
 */
function effectivePlanPrice(
  plan: SubscriptionPlan,
  promotions?: SubscriptionPromotion[]
): { price: number; promotion?: SubscriptionPromotion } {
  const promo = activePromotionForPeriod(plan.period, promotions);
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
    if (!apiConfig.useMocks) return eventsRepo.list(params);
    let items = db.events;
    items = applySearch(items, params.search, ["name", "organizationName", "city"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    if (!apiConfig.useMocks) return eventsRepo.get(id);
    return mockResolve(db.events.find((e) => e.id === id) ?? null);
  },
  ticketsFor(eventId: string) {
    if (!apiConfig.useMocks) return eventsRepo.ticketsFor(eventId);
    return mockResolve(db.ticketTypes.filter((t) => t.eventId === eventId));
  },
  ordersFor(eventId: string) {
    // Pas encore branché sur Supabase (les commandes mobiles sont privées) :
    // renvoie les commandes mock côté back-office.
    return mockResolve(db.orders.filter((o) => o.eventId === eventId).slice(0, 8));
  },
  byOrg(orgId: string) {
    if (!apiConfig.useMocks) return eventsRepo.byOrg(orgId);
    return mockResolve(db.events.filter((e) => e.organizationId === orgId));
  },
  create(input: EventInput) {
    if (!apiConfig.useMocks) return eventsRepo.create(input);
    const id = `evt-${db.events.length + 1}-${Date.now().toString(36)}`;
    const event: EventItem = {
      id,
      name: input.name,
      description: input.description ?? "",
      organizationId: input.organizationId,
      organizationName:
        db.organizations.find((o) => o.id === input.organizationId)?.name ?? "",
      categoryId: input.categoryId ?? "",
      eventTypeId: "",
      region: input.region ?? "",
      city: input.city ?? "",
      address: input.address ?? "",
      startDate: input.startDate,
      endDate: input.endDate,
      status: (input.status ?? "upcoming") as EventItem["status"],
      coverImage: input.coverImage ?? "",
      ticketsSold: 0,
      ticketsTotal: 0,
      revenue: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.events.push(event);
    return mockResolve(event);
  },
  update(id: string, patch: Partial<EventInput>) {
    if (!apiConfig.useMocks) return eventsRepo.update(id, patch);
    const event = db.events.find((e) => e.id === id);
    if (!event) return mockResolve(null);
    if (patch.name !== undefined) event.name = patch.name;
    if (patch.description !== undefined) event.description = patch.description;
    if (patch.categoryId !== undefined) event.categoryId = patch.categoryId;
    if (patch.region !== undefined) event.region = patch.region;
    if (patch.city !== undefined) event.city = patch.city;
    if (patch.address !== undefined) event.address = patch.address;
    if (patch.startDate !== undefined) event.startDate = patch.startDate;
    if (patch.endDate !== undefined) event.endDate = patch.endDate;
    if (patch.coverImage !== undefined) event.coverImage = patch.coverImage;
    if (patch.status !== undefined) event.status = patch.status as EventItem["status"];
    return mockResolve(event);
  },
  setStatus(id: string, status: EventDbStatus) {
    if (!apiConfig.useMocks) return eventsRepo.setStatus(id, status);
    const event = db.events.find((e) => e.id === id);
    if (!event) return mockResolve(null);
    event.status = status as EventItem["status"];
    return mockResolve(event);
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return eventsRepo.remove(id);
    const idx = db.events.findIndex((e) => e.id === id);
    if (idx >= 0) db.events.splice(idx, 1);
    return mockResolve({ ok: true });
  },
  addTicketType(eventId: string, input: TicketTypeInput) {
    if (!apiConfig.useMocks) return eventsRepo.addTicketType(eventId, input);
    const ticket: TicketType = {
      id: `tt-${Date.now().toString(36)}`,
      eventId,
      name: input.name,
      price: input.price,
      quantity: input.quantity,
      sold: 0,
      saleStart: "",
      saleEnd: "",
      status: "on_sale",
    };
    db.ticketTypes.push(ticket);
    return mockResolve(ticket);
  },
  updateTicketType(ticketTypeId: string, patch: Partial<TicketTypeInput>) {
    if (!apiConfig.useMocks) return eventsRepo.updateTicketType(ticketTypeId, patch);
    const tt = db.ticketTypes.find((t) => t.id === ticketTypeId);
    if (!tt) return mockResolve(null);
    if (patch.name !== undefined) tt.name = patch.name;
    if (patch.price !== undefined) tt.price = patch.price;
    if (patch.quantity !== undefined) tt.quantity = patch.quantity;
    return mockResolve(tt);
  },
  /**
   * Retire un type de billet : suppression s'il n'a jamais été vendu,
   * sinon désactivation (préserve l'historique). Retourne l'action réalisée.
   */
  removeTicketType(ticketTypeId: string): Promise<{ ok: true; action: "deleted" | "deactivated" }> {
    if (!apiConfig.useMocks) return eventsRepo.removeTicketType(ticketTypeId);
    const idx = db.ticketTypes.findIndex((t) => t.id === ticketTypeId);
    if (idx >= 0) db.ticketTypes.splice(idx, 1);
    return mockResolve({ ok: true, action: "deleted" });
  },
  /** Désactive un type de billet (retiré de la vente, conservé). */
  deactivateTicketType(ticketTypeId: string) {
    if (!apiConfig.useMocks) return eventsRepo.deactivateTicketType(ticketTypeId);
    const tt = db.ticketTypes.find((t) => t.id === ticketTypeId);
    if (tt) tt.status = "paused";
    return mockResolve({ ok: true });
  },
  /** Catégories réelles (id + nom) pour les sélecteurs de formulaire. */
  categories(): Promise<{ id: string; name: string }[]> {
    if (!apiConfig.useMocks) return eventsRepo.categories();
    return mockResolve(db.categories.map((c) => ({ id: c.id, name: c.name })));
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
  /**
   * Tous les types de billets enrichis (nom d'événement + organisation).
   * Mode réel : Supabase (RLS applique déjà le périmètre de l'utilisateur).
   * Mode mock : on rattache le nom/organisation depuis les événements mock.
   */
  allWithEvents(): Promise<TicketTypeWithEvent[]> {
    if (!apiConfig.useMocks) return eventsRepo.allTicketTypes();
    const byId = new Map(db.events.map((e) => [e.id, e]));
    return mockResolve(
      db.ticketTypes.map((t) => ({
        ...t,
        eventName: byId.get(t.eventId)?.name ?? "",
        organizationId: byId.get(t.eventId)?.organizationId ?? "",
      })),
    );
  },
};

export const orderService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return ordersRepo.list(params);
    let items = db.orders;
    items = applySearch(items, params.search, ["reference", "customerName", "eventName"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    if (!apiConfig.useMocks) return ordersRepo.get(id);
    return mockResolve(db.orders.find((o) => o.id === id) ?? null);
  },
  byOrg(orgId: string, params: QueryParams = {}) {
    if (!apiConfig.useMocks) return ordersRepo.byOrg(orgId, params);
    let items = db.orders.filter((o) => o.organizationId === orgId);
    items = applySearch(items, params.search, ["reference", "customerName", "eventName"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
};

export const userService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return endUsersRepo.list(params);
    let items = db.endUsers;
    items = applySearch(items, params.search, ["name", "email", "phone"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    if (!apiConfig.useMocks) return endUsersRepo.get(id);
    return mockResolve(db.endUsers.find((u) => u.id === id) ?? null);
  },
};

export const adminService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return adminsRepo.list(params);
    let items = db.admins;
    items = applySearch(items, params.search, ["name", "organizationName", "email"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy ?? "revenue", params.sortDir ?? "desc");
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    if (!apiConfig.useMocks) return adminsRepo.get(id);
    return mockResolve(db.admins.find((a) => a.id === id) ?? null);
  },
};

export const organizationService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return organizationsRepo.list(params);
    let items = db.organizations;
    items = applySearch(items, params.search, ["name", "email", "city"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    if (!apiConfig.useMocks) return organizationsRepo.get(id);
    return mockResolve(db.organizations.find((o) => o.id === id) ?? null);
  },
  create(input: OrganizationInput) {
    if (!apiConfig.useMocks) return organizationsRepo.create(input);
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
    if (!apiConfig.useMocks) return organizationsRepo.update(id, patch);
    const org = db.organizations.find((o) => o.id === id);
    if (!org) return mockResolve(null);
    Object.assign(org, patch);
    return mockResolve(org);
  },
};

export const paymentService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return paymentsRepo.list(params);
    let items = db.payments;
    items = applySearch(items, params.search, ["transactionId", "orderRef", "customerName"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
};

export const licenseService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return licensesRepo.list(params);
    let items = db.licenses;
    items = applySearch(items, params.search, ["organizationName", "type"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
};

export const categoryService = {
  all() {
    if (!apiConfig.useMocks) return eventsRepo.categoriesFull();
    return mockResolve(db.categories);
  },
  create(input: CategoryInput) {
    if (!apiConfig.useMocks) return categoriesRepo.create(input);
    return mockResolve({ id: `cat-${Date.now().toString(36)}` });
  },
  update(id: string, patch: CategoryInput) {
    if (!apiConfig.useMocks) return categoriesRepo.update(id, patch);
    return mockResolve({ ok: true as const });
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return categoriesRepo.remove(id);
    return mockResolve({ ok: true as const });
  },
};

export const eventTypeService = {
  all() {
    if (!apiConfig.useMocks) return eventTypesRepo.all();
    return mockResolve(db.eventTypes);
  },
  create(input: EventTypeInput) {
    if (!apiConfig.useMocks) return eventTypesRepo.create(input);
    return mockResolve({ id: `et-${Date.now().toString(36)}` });
  },
  update(id: string, patch: EventTypeInput) {
    if (!apiConfig.useMocks) return eventTypesRepo.update(id, patch);
    return mockResolve({ ok: true as const });
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return eventTypesRepo.remove(id);
    return mockResolve({ ok: true as const });
  },
};

export const promotionService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return promotionsRepo.list(params);
    let items = db.promotions;
    items = applySearch(items, params.search, ["name", "code"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  byOrg(orgId: string) {
    if (!apiConfig.useMocks) return promotionsRepo.byOrg(orgId);
    return mockResolve(db.promotions.filter((p) => p.organizationId === orgId));
  },
  create(input: PromotionInput) {
    if (!apiConfig.useMocks) return promotionsRepo.create(input);
    return mockResolve({ id: `promo-${Date.now().toString(36)}` });
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return promotionsRepo.remove(id);
    return mockResolve({ ok: true as const });
  },
};

// ============================================================
// Subscriptions
// ============================================================

export const planService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return plansRepo.list(params);
    let items = db.subscriptionPlans;
    items = applySearch(items, params.search, ["name", "description"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 20));
  },
  all() {
    if (!apiConfig.useMocks) return plansRepo.all();
    return mockResolve(db.subscriptionPlans);
  },
  get(id: string) {
    if (!apiConfig.useMocks) return plansRepo.get(id);
    return mockResolve(db.subscriptionPlans.find((p) => p.id === id) ?? null);
  },
  create(input: PlanInput) {
    if (!apiConfig.useMocks) return plansRepo.create(input);
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
    if (!apiConfig.useMocks) return plansRepo.update(id, patch);
    const plan = db.subscriptionPlans.find((p) => p.id === id);
    if (!plan) return mockResolve(null);
    Object.assign(plan, patch);
    return mockResolve(plan);
  },
  setStatus(id: string, status: SubscriptionPlan["status"]) {
    if (!apiConfig.useMocks) return plansRepo.setStatus(id, status);
    const plan = db.subscriptionPlans.find((p) => p.id === id);
    if (!plan) return mockResolve(null);
    plan.status = status;
    return mockResolve(plan);
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return plansRepo.remove(id);
    const idx = db.subscriptionPlans.findIndex((p) => p.id === id);
    if (idx >= 0) db.subscriptionPlans.splice(idx, 1);
    return mockResolve({ ok: true });
  },
  /** Effective price of a plan today, applying any active matching promotion. */
  effectivePrice(plan: SubscriptionPlan, promotions?: SubscriptionPromotion[]) {
    return effectivePlanPrice(plan, promotions);
  },
};

export const subscriptionService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return subscriptionsRepo.list(params);
    let items = db.subscriptions.map(withComputedStatus);
    items = applySearch(items, params.search, ["organizationName", "planName"]);
    items = applyFilters(items, params.filters);
    items = applySort(items, params.sortBy, params.sortDir);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 10));
  },
  get(id: string) {
    if (!apiConfig.useMocks) return subscriptionsRepo.get(id);
    const sub = db.subscriptions.find((s) => s.id === id);
    return mockResolve(sub ? withComputedStatus(sub) : null);
  },
  byOrg(orgId: string) {
    if (!apiConfig.useMocks) return subscriptionsRepo.byOrg(orgId);
    const sub = db.subscriptions.find((s) => s.organizationId === orgId);
    return mockResolve(sub ? withComputedStatus(sub) : null);
  },
  paymentsFor(subscriptionId: string) {
    if (!apiConfig.useMocks) return subscriptionsRepo.paymentsFor(subscriptionId);
    return mockResolve(
      db.subscriptionPayments
        .filter((p) => p.subscriptionId === subscriptionId)
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    );
  },
  paymentsForOrg(orgId: string) {
    if (!apiConfig.useMocks) return subscriptionsRepo.paymentsForOrg(orgId);
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
    if (!apiConfig.useMocks) return subscriptionsRepo.canPublish(orgId);
    const sub = db.subscriptions.find((s) => s.organizationId === orgId);
    const status = sub ? computeStatus(sub) : "expired";
    return mockResolve({ allowed: status === "active", status });
  },
};

export const subscriptionPromotionService = {
  list(params: QueryParams = {}) {
    if (!apiConfig.useMocks) return subscriptionPromotionsRepo.list(params);
    let items = db.subscriptionPromotions;
    items = applySearch(items, params.search, ["name"]);
    items = applyFilters(items, params.filters);
    return mockResolve(paginate(items, params.page, params.pageSize ?? 20));
  },
  all() {
    if (!apiConfig.useMocks) return subscriptionPromotionsRepo.all();
    return mockResolve(db.subscriptionPromotions);
  },
  create(input: SubscriptionPromotionInput) {
    if (!apiConfig.useMocks) return subscriptionPromotionsRepo.create(input);
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
    if (!apiConfig.useMocks) return subscriptionPromotionsRepo.update(id, patch);
    const promo = db.subscriptionPromotions.find((p) => p.id === id);
    if (!promo) return mockResolve(null);
    Object.assign(promo, patch);
    return mockResolve(promo);
  },
  setStatus(id: string, status: SubscriptionPromotion["status"]) {
    if (!apiConfig.useMocks) return subscriptionPromotionsRepo.setStatus(id, status);
    const promo = db.subscriptionPromotions.find((p) => p.id === id);
    if (!promo) return mockResolve(null);
    promo.status = status;
    return mockResolve(promo);
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return subscriptionPromotionsRepo.remove(id);
    const idx = db.subscriptionPromotions.findIndex((p) => p.id === id);
    if (idx >= 0) db.subscriptionPromotions.splice(idx, 1);
    return mockResolve({ ok: true });
  },
};

export const notificationService = {
  all() {
    if (!apiConfig.useMocks) return notificationsRepo.all();
    return mockResolve(db.notifications);
  },
  create(input: NotificationInput) {
    if (!apiConfig.useMocks) return notificationsRepo.create(input);
    return mockResolve({ id: `notif-${Date.now().toString(36)}` });
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return notificationsRepo.remove(id);
    return mockResolve({ ok: true as const });
  },
};

export const articleService = {
  all() {
    if (!apiConfig.useMocks) return articlesRepo.all();
    return mockResolve(db.articles);
  },
  create(input: ArticleInput) {
    if (!apiConfig.useMocks) return articlesRepo.create(input);
    return mockResolve({ id: `art-${Date.now().toString(36)}` });
  },
  remove(id: string) {
    if (!apiConfig.useMocks) return articlesRepo.remove(id);
    return mockResolve({ ok: true as const });
  },
};

export const analyticsService = {
  revenueOverTime: (orgId?: string) =>
    apiConfig.useMocks ? mockResolve(analytics.revenueOverTime) : analyticsRepo.revenueOverTime(orgId),
  ticketsOverTime: (orgId?: string) =>
    apiConfig.useMocks ? mockResolve(analytics.ticketsOverTime) : analyticsRepo.ticketsOverTime(orgId),
  eventsBreakdown: () =>
    apiConfig.useMocks ? mockResolve(analytics.eventsBreakdown) : analyticsRepo.eventsBreakdown(),
  usersByRegion: () =>
    apiConfig.useMocks ? mockResolve(analytics.usersByRegion) : analyticsRepo.usersByRegion(),
  revenueByCategory: () =>
    apiConfig.useMocks ? mockResolve(analytics.revenueByCategory) : analyticsRepo.revenueByCategory(),
  ticketDistribution: (orgId?: string) =>
    apiConfig.useMocks ? mockResolve(analytics.ticketDistribution) : analyticsRepo.ticketDistribution(orgId),
  topOrganizations: () =>
    apiConfig.useMocks ? mockResolve(analytics.topOrganizations) : analyticsRepo.topOrganizations(),
  topEvents: (orgId?: string) =>
    apiConfig.useMocks ? mockResolve(analytics.topEvents) : analyticsRepo.topEvents(orgId),
};

// --- Dashboard KPI aggregation ---
export const dashboardService = {
  superAdminKpis() {
    if (!apiConfig.useMocks) return analyticsRepo.superAdminKpis();
    // Les revenus sont exprimés dans la devise de chaque entreprise :
    // on les convertit en devise de référence avant de les additionner.
    const totalRevenue = db.organizations.reduce(
      (s, o) => s + countryAmountToReference(o.revenue, o.countryCode),
      0
    );
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
    if (!apiConfig.useMocks) return analyticsRepo.subscriptionKpis();
    const subs = db.subscriptions.map(withComputedStatus);
    const now = Date.now();
    const soon = now + 30 * 24 * 60 * 60 * 1000;
    const expiringSoon = subs.filter(
      (s) => s.status === "active" && new Date(s.endDate).getTime() <= soon
    ).length;
    const orgCountry = new Map(db.organizations.map((o) => [o.id, o.countryCode]));
    const subscriptionRevenue = db.subscriptionPayments
      .filter((p) => p.status === "successful")
      .reduce((s, p) => s + countryAmountToReference(p.amount, orgCountry.get(p.organizationId)), 0);
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
    if (!apiConfig.useMocks) return analyticsRepo.adminKpis(orgId);
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

// ============================================================
// Media (upload d'images)
// ============================================================
export const mediaService = {
  /**
   * Téléverse une image et renvoie son URL.
   * - Mode réel : upload vers Supabase Storage (bucket "event-images").
   * - Mode mock : renvoie une data URL locale (aucun réseau).
   */
  uploadImage(file: File, folder = "covers"): Promise<string> {
    if (!apiConfig.useMocks) return storageRepo.uploadImage(file, folder);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
      reader.readAsDataURL(file);
    });
  },
};

export type { TicketTypeWithEvent } from "@/api/repositories/events";

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
