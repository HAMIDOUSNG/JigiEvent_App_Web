import { getSupabase } from "@/api/supabase";
import type { QueryParams } from "@/services/helpers";
import type {
  Subscription,
  SubscriptionPayment,
  SubscriptionStatus,
  Paginated,
} from "@/types";

type SubRow = {
  id: string;
  organization_id: string;
  plan_id: string | null;
  plan_name: string;
  period: Subscription["period"];
  price_paid: number;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  applied_promotion_id: string | null;
  created_at: string;
  organizations?: { name: string } | null;
};

type PayRow = {
  id: string;
  subscription_id: string;
  organization_id: string;
  plan_name: string;
  period: SubscriptionPayment["period"];
  amount: number;
  method: string;
  status: SubscriptionPayment["status"];
  promotion_name: string | null;
  paid_at: string;
  organizations?: { name: string } | null;
};

/** Statut vivant, dérivé de la date d'expiration (cohérent avec les mocks). */
function computeStatus(row: SubRow): SubscriptionStatus {
  if (row.status === "suspended") return "suspended";
  return new Date(row.end_date).getTime() < Date.now() ? "expired" : "active";
}

function toSubscription(r: SubRow): Subscription {
  return {
    id: r.id,
    organizationId: r.organization_id,
    organizationName: r.organizations?.name ?? "",
    planId: r.plan_id ?? "",
    planName: r.plan_name,
    period: r.period,
    pricePaid: r.price_paid,
    startDate: r.start_date,
    endDate: r.end_date,
    status: computeStatus(r),
    appliedPromotionId: r.applied_promotion_id ?? undefined,
    createdAt: r.created_at,
  };
}

function toPayment(r: PayRow): SubscriptionPayment {
  return {
    id: r.id,
    subscriptionId: r.subscription_id,
    organizationId: r.organization_id,
    organizationName: r.organizations?.name ?? "",
    planName: r.plan_name,
    period: r.period,
    amount: r.amount,
    method: r.method as SubscriptionPayment["method"],
    status: r.status,
    promotionName: r.promotion_name ?? undefined,
    paidAt: r.paid_at,
  };
}

const SUB_SELECT = "*, organizations(name)";
const PAY_SELECT = "*, organizations(name)";

export const subscriptionsRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<Subscription>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    let q = sb.from("subscriptions").select(SUB_SELECT, { count: "exact" });
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === "all") continue;
      // status est calculé côté client ; on ne filtre en base que sur "period".
      if (key === "period") q = q.eq("period", value);
    }
    const asc = params.sortDir !== "desc";
    const sortCol = params.sortBy === "endDate" ? "end_date" : params.sortBy === "pricePaid" ? "price_paid" : "end_date";
    const { data, count, error } = await q.order(sortCol, { ascending: asc }).range(from, from + pageSize - 1);
    if (error) throw error;
    let items = (data as SubRow[]).map(toSubscription);
    // Filtre statut + recherche appliqués côté client (statut dérivé).
    if (params.filters?.status && params.filters.status !== "all") {
      items = items.filter((s) => s.status === params.filters!.status);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      items = items.filter(
        (i) => i.organizationName.toLowerCase().includes(s) || i.planName.toLowerCase().includes(s)
      );
    }
    return { data: items, total: count ?? items.length, page, pageSize };
  },

  async get(id: string): Promise<Subscription | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("subscriptions").select(SUB_SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toSubscription(data as SubRow) : null;
  },

  async byOrg(orgId: string): Promise<Subscription | null> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("subscriptions")
      .select(SUB_SELECT)
      .eq("organization_id", orgId)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toSubscription(data as SubRow) : null;
  },

  async paymentsFor(subscriptionId: string): Promise<SubscriptionPayment[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("subscription_payments")
      .select(PAY_SELECT)
      .eq("subscription_id", subscriptionId)
      .order("paid_at", { ascending: false });
    if (error) throw error;
    return (data as PayRow[]).map(toPayment);
  },

  async paymentsForOrg(orgId: string): Promise<SubscriptionPayment[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("subscription_payments")
      .select(PAY_SELECT)
      .eq("organization_id", orgId)
      .order("paid_at", { ascending: false });
    if (error) throw error;
    return (data as PayRow[]).map(toPayment);
  },

  async canPublish(orgId: string): Promise<{ allowed: boolean; status: SubscriptionStatus }> {
    const sub = await this.byOrg(orgId);
    const status: SubscriptionStatus = sub ? sub.status : "expired";
    return { allowed: status === "active", status };
  },
};
