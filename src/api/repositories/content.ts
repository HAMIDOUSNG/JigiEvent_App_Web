import { getSupabase } from "@/api/supabase";
import type { QueryParams } from "@/services/helpers";
import type {
  AdminAccount,
  Article,
  EndUser,
  EventType,
  License,
  LicenseStatus,
  NotificationCampaign,
  NotificationChannel,
  Paginated,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Promotion,
  PromotionStatus,
  ContentStatus,
  EntityStatus,
} from "@/types";

// ============================================================
// Domaines "contenu" et vues dérivées (voir supabase/content_tables.sql).
// Vues : admins_view, end_users_view, payments_view (lecture seule).
// Tables : event_types, licenses, notification_campaigns, articles, promotions.
// ============================================================

function paginateParams(params: QueryParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  return { page, pageSize, from: (page - 1) * pageSize, to: (page - 1) * pageSize + pageSize - 1 };
}

/** Codes signalant une table/vue absente (migration content_tables.sql non appliquée). */
function isMissingRelation(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01" || error?.code === "PGRST202";
}

/** Journalise un avertissement une fois si la relation n'existe pas encore. */
function warnMissing(name: string) {
  if (typeof console !== "undefined") {
    console.warn(`[content] "${name}" absent. Exécutez supabase/content_tables.sql pour activer les données réelles.`);
  }
}

/** Génère un slug simple à partir d'un nom. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---- Catégories (table categories) : CRUD complet ----
export interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
}
export const categoriesRepo = {
  async create(input: CategoryInput): Promise<{ id: string }> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("categories")
      .insert({ name: input.name, slug: slugify(input.name), icon: input.icon ?? "" })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },
  async update(id: string, patch: CategoryInput): Promise<{ ok: true }> {
    const sb = getSupabase();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) { row.name = patch.name; row.slug = slugify(patch.name); }
    if (patch.icon !== undefined) row.icon = patch.icon;
    const { error } = await sb.from("categories").update(row).eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
};

// ---- Administrateurs (vue admins_view) ----
type AdminRow = {
  id: string; name: string; email: string; phone: string;
  organization_id: string | null; organization_name: string; category_id: string;
  region: string; status: EntityStatus; events_count: number; revenue: number; created_at: string;
};
function toAdmin(r: AdminRow): AdminAccount {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    organizationId: r.organization_id ?? "",
    organizationName: r.organization_name,
    categoryId: r.category_id,
    region: r.region,
    licenseType: "",
    licenseStatus: "active" as LicenseStatus,
    eventsCount: Number(r.events_count) || 0,
    revenue: Number(r.revenue) || 0,
    status: r.status,
    createdAt: r.created_at,
  };
}

export const adminsRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<AdminAccount>> {
    const sb = getSupabase();
    const { page, pageSize, from, to } = paginateParams(params);
    let q = sb.from("admins_view").select("*", { count: "exact" });
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`name.ilike.${s},email.ilike.${s},organization_name.ilike.${s}`);
    }
    const { data, count, error } = await q.range(from, to);
    if (error) {
      if (isMissingRelation(error)) { warnMissing("admins_view"); return { data: [], total: 0, page, pageSize }; }
      throw error;
    }
    return { data: (data as AdminRow[]).map(toAdmin), total: count ?? 0, page, pageSize };
  },
  async get(id: string): Promise<AdminAccount | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("admins_view").select("*").eq("id", id).maybeSingle();
    if (error) { if (isMissingRelation(error)) { warnMissing("admins_view"); return null; } throw error; }
    return data ? toAdmin(data as AdminRow) : null;
  },
};

// ---- Utilisateurs finaux (vue end_users_view) ----
type EndUserRow = {
  id: string; name: string; email: string; phone: string; region: string;
  tickets_purchased: number; total_spent: number; created_at: string;
};
function toEndUser(r: EndUserRow): EndUser {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    region: r.region,
    ticketsPurchased: Number(r.tickets_purchased) || 0,
    totalSpent: Number(r.total_spent) || 0,
    status: "active",
    createdAt: r.created_at,
  };
}

export const endUsersRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<EndUser>> {
    const sb = getSupabase();
    const { page, pageSize, from, to } = paginateParams(params);
    let q = sb.from("end_users_view").select("*", { count: "exact" });
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`name.ilike.${s},email.ilike.${s}`);
    }
    const { data, count, error } = await q.range(from, to);
    if (error) {
      if (isMissingRelation(error)) { warnMissing("end_users_view"); return { data: [], total: 0, page, pageSize }; }
      throw error;
    }
    return { data: (data as EndUserRow[]).map(toEndUser), total: count ?? 0, page, pageSize };
  },
  async get(id: string): Promise<EndUser | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("end_users_view").select("*").eq("id", id).maybeSingle();
    if (error) { if (isMissingRelation(error)) { warnMissing("end_users_view"); return null; } throw error; }
    return data ? toEndUser(data as EndUserRow) : null;
  },
};

// ---- Paiements (vue payments_view, dérivée des orders) ----
type PaymentRow = {
  id: string; order_id: string; order_ref: string; customer_name: string;
  organization_id: string; organization_name: string | null; amount: number;
  method: PaymentMethod; status: string; created_at: string;
};
/** Enum DB order_status (confirmed|pending|failed|refunded) -> PaymentStatus front. */
function toPaymentStatus(dbStatus: string): PaymentStatus {
  switch (dbStatus) {
    case "confirmed": return "successful";
    case "failed": return "failed";
    case "refunded": return "refunded";
    default: return "pending";
  }
}
function toPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    transactionId: r.order_ref,
    orderId: r.order_id,
    orderRef: r.order_ref,
    customerName: r.customer_name,
    organizationId: r.organization_id,
    organizationName: r.organization_name ?? "",
    amount: Number(r.amount) || 0,
    method: r.method,
    status: toPaymentStatus(r.status),
    createdAt: r.created_at,
  };
}

export const paymentsRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<Payment>> {
    const sb = getSupabase();
    const { page, pageSize, from, to } = paginateParams(params);
    let q = sb.from("payments_view").select("*", { count: "exact" });
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`order_ref.ilike.${s},customer_name.ilike.${s}`);
    }
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === "all") continue;
      if (key === "method") q = q.eq("method", value);
      if (key === "organizationId") q = q.eq("organization_id", value);
      // Le statut front est dérivé : on ne filtre pas côté DB pour rester simple.
    }
    q = q.order("created_at", { ascending: params.sortDir !== "asc" });
    const { data, count, error } = await q.range(from, to);
    if (error) {
      if (isMissingRelation(error)) { warnMissing("payments_view"); return { data: [], total: 0, page, pageSize }; }
      throw error;
    }
    return { data: (data as PaymentRow[]).map(toPayment), total: count ?? 0, page, pageSize };
  },
};

// ---- Types d'événement (table event_types) ----
type EventTypeRow = { id: string; name: string; description: string };
export interface EventTypeInput {
  name: string;
  description?: string;
}
export const eventTypesRepo = {
  async all(): Promise<EventType[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from("event_types").select("*").order("name");
    if (error) {
      if (isMissingRelation(error)) { warnMissing("event_types"); return []; }
      throw error;
    }
    return (data as EventTypeRow[]).map((r) => ({
      id: r.id, name: r.name, description: r.description ?? "", eventsCount: 0,
    }));
  },
  async create(input: EventTypeInput): Promise<{ id: string }> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("event_types")
      .insert({ name: input.name, description: input.description ?? "" })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },
  async update(id: string, patch: EventTypeInput): Promise<{ ok: true }> {
    const sb = getSupabase();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.description !== undefined) row.description = patch.description;
    const { error } = await sb.from("event_types").update(row).eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("event_types").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
};

// ---- Licences (table licenses) ----
type LicenseRow = {
  id: string; organization_id: string; type: string;
  start_date: string; end_date: string; status: LicenseStatus;
};
export const licensesRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<License>> {
    const sb = getSupabase();
    const { page, pageSize, from, to } = paginateParams(params);
    const { data, count, error } = await sb
      .from("licenses")
      .select("*, organizations(name)", { count: "exact" })
      .range(from, to);
    if (error) {
      if (isMissingRelation(error)) { warnMissing("licenses"); return { data: [], total: 0, page, pageSize }; }
      throw error;
    }
    const rows = (data as (LicenseRow & { organizations: { name: string } | null })[]) ?? [];
    return {
      data: rows.map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        organizationName: r.organizations?.name ?? "",
        type: r.type,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        revenue: 0,
      })),
      total: count ?? 0,
      page,
      pageSize,
    };
  },
};

// ---- Campagnes de notification (table notification_campaigns) ----
type NotifRow = {
  id: string; title: string; message: string; channel: NotificationChannel;
  audience: string; scheduled_at: string | null; status: "sent" | "scheduled" | "draft"; reach: number;
};
export const notificationsRepo = {
  async all(): Promise<NotificationCampaign[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("notification_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingRelation(error)) { warnMissing("notification_campaigns"); return []; }
      throw error;
    }
    return (data as NotifRow[]).map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      channel: r.channel,
      audience: r.audience,
      scheduledAt: r.scheduled_at ?? "",
      status: r.status,
      reach: Number(r.reach) || 0,
    }));
  },
  async create(input: NotificationInput): Promise<{ id: string }> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("notification_campaigns")
      .insert({
        title: input.title,
        message: input.message ?? "",
        channel: input.channel ?? "push",
        audience: input.audience ?? "",
        scheduled_at: input.scheduledAt || null,
        status: input.status ?? "draft",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },
  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("notification_campaigns").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
};

export interface NotificationInput {
  title: string;
  message?: string;
  channel?: NotificationChannel;
  audience?: string;
  scheduledAt?: string;
  status?: "sent" | "scheduled" | "draft";
}

// ---- Articles (table articles) ----
type ArticleRow = {
  id: string; title: string; cover: string; excerpt: string; author: string;
  category: string; status: ContentStatus; published_date: string | null; views: number;
};
export const articlesRepo = {
  async all(): Promise<Article[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from("articles").select("*").order("created_at", { ascending: false });
    if (error) {
      if (isMissingRelation(error)) { warnMissing("articles"); return []; }
      throw error;
    }
    return (data as ArticleRow[]).map((r) => ({
      id: r.id,
      title: r.title,
      cover: r.cover,
      excerpt: r.excerpt,
      author: r.author,
      category: r.category,
      status: r.status,
      publishedDate: r.published_date ?? "",
      views: Number(r.views) || 0,
    }));
  },
  async create(input: ArticleInput): Promise<{ id: string }> {
    const sb = getSupabase();
    const publish = input.status === "published";
    const { data, error } = await sb
      .from("articles")
      .insert({
        title: input.title,
        cover: input.cover ?? "",
        excerpt: input.excerpt ?? "",
        author: input.author ?? "",
        category: input.category ?? "",
        status: input.status ?? "draft",
        published_date: publish ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },
  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("articles").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
};

export interface ArticleInput {
  title: string;
  cover?: string;
  excerpt?: string;
  author?: string;
  category?: string;
  status?: ContentStatus;
}

// ---- Promotions (table promotions) ----
type PromotionRow = {
  id: string; organization_id: string | null; name: string; code: string;
  discount_percent: number; start_date: string; end_date: string;
  applicable_events: string; target_audience: string; status: PromotionStatus; usage_count: number;
};
function toPromotion(r: PromotionRow): Promotion {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    discountPercent: Number(r.discount_percent) || 0,
    startDate: r.start_date,
    endDate: r.end_date,
    applicableEvents: r.applicable_events,
    targetAudience: r.target_audience,
    status: r.status,
    usageCount: Number(r.usage_count) || 0,
    organizationId: r.organization_id ?? undefined,
  };
}
export const promotionsRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<Promotion>> {
    const sb = getSupabase();
    const { page, pageSize, from, to } = paginateParams(params);
    let q = sb.from("promotions").select("*", { count: "exact" });
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`name.ilike.${s},code.ilike.${s}`);
    }
    const { data, count, error } = await q.range(from, to);
    if (error) {
      if (isMissingRelation(error)) { warnMissing("promotions"); return { data: [], total: 0, page, pageSize }; }
      throw error;
    }
    return { data: (data as PromotionRow[]).map(toPromotion), total: count ?? 0, page, pageSize };
  },
  async byOrg(orgId: string): Promise<Promotion[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from("promotions").select("*").eq("organization_id", orgId);
    if (error) {
      if (isMissingRelation(error)) { warnMissing("promotions"); return []; }
      throw error;
    }
    return (data as PromotionRow[]).map(toPromotion);
  },
  async create(input: PromotionInput): Promise<{ id: string }> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("promotions")
      .insert({
        organization_id: input.organizationId ?? null,
        name: input.name,
        code: input.code,
        discount_percent: input.discountPercent ?? 0,
        start_date: input.startDate,
        end_date: input.endDate,
        applicable_events: input.applicableEvents ?? "all",
        target_audience: input.targetAudience ?? "all",
        status: input.status ?? "scheduled",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },
  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("promotions").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
};

export interface PromotionInput {
  name: string;
  code: string;
  discountPercent?: number;
  startDate: string;
  endDate: string;
  applicableEvents?: string;
  targetAudience?: string;
  status?: PromotionStatus;
  organizationId?: string;
}
