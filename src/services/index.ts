import { mockResolve } from "@/api/client";
import * as db from "@/mocks/data";
import * as analytics from "@/mocks/analytics";
import { applyFilters, applySearch, applySort, paginate, type QueryParams } from "./helpers";
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
  TicketType,
} from "@/types";

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
  TicketType,
};
