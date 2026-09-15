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
  // Champs fournis par la vue subscriptions_view (source de vérité en base).
  organization_name?: string | null;
  effective_status?: SubscriptionStatus | null;
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

/**
 * Statut vivant : privilégie effective_status calculé par la vue
 * (source de vérité en base) ; repli sur un calcul local si absent.
 */
function computeStatus(row: SubRow): SubscriptionStatus {
  if (row.effective_status) return row.effective_status;
  if (row.status === "suspended") return "suspended";
  return new Date(row.end_date).getTime() < Date.now() ? "expired" : "active";
}

function toSubscription(r: SubRow): Subscription {
  return {
    id: r.id,
    organizationId: r.organization_id,
    organizationName: r.organization_name ?? "",
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

// La vue expose organization_name + effective_status (source de vérité).
const SUB_VIEW = "subscriptions_view";
const PAY_SELECT = "*, organizations(name)";

export const subscriptionsRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<Subscription>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    let q = sb.from(SUB_VIEW).select("*", { count: "exact" });

    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === "all") continue;
      if (key === "period") q = q.eq("period", value);
      // Le statut est filtré en base via la colonne calculée de la vue.
      if (key === "status") q = q.eq("effective_status", value);
    }
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`organization_name.ilike.${s},plan_name.ilike.${s}`);
    }
    const asc = params.sortDir !== "desc";
    const sortCol = params.sortBy === "pricePaid" ? "price_paid" : "end_date";

    const { data, count, error } = await q.order(sortCol, { ascending: asc }).range(from, from + pageSize - 1);
    if (error) throw error;
    return {
      data: (data as SubRow[]).map(toSubscription),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Subscription | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from(SUB_VIEW).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toSubscription(data as SubRow) : null;
  },

  async byOrg(orgId: string): Promise<Subscription | null> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from(SUB_VIEW)
      .select("*")
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
    const sb = getSupabase();
    // Source de vérité en base : fonction can_publish(org).
    const { data, error } = await sb.rpc("can_publish", { org: orgId });
    if (error) throw error;
    const allowed = Boolean(data);
    // On récupère le statut détaillé pour l'affichage.
    const sub = await this.byOrg(orgId);
    const status: SubscriptionStatus = sub ? sub.status : "expired";
    return { allowed, status };
  },
};
