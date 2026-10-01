import { getSupabase } from "@/api/supabase";
import type { QueryParams } from "@/services/helpers";
import type { SubscriptionPromotion, Paginated } from "@/types";
import type { SubscriptionPromotionInput } from "@/services";

type Row = {
  id: string;
  name: string;
  period: SubscriptionPromotion["period"];
  discount_type: "percent" | "fixed";
  discount_percent: number | null;
  promo_price: number | null;
  start_date: string;
  end_date: string;
  status: SubscriptionPromotion["status"];
  created_at: string;
};

function toPromotion(r: Row): SubscriptionPromotion {
  return {
    id: r.id,
    name: r.name,
    period: r.period,
    discountType: r.discount_type,
    discountPercent: r.discount_percent ?? undefined,
    promoPrice: r.promo_price ?? undefined,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    createdAt: r.created_at,
  };
}

function toRow(input: Partial<SubscriptionPromotion & SubscriptionPromotionInput>) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.period !== undefined) row.period = input.period;
  if (input.discountType !== undefined) row.discount_type = input.discountType;
  if (input.discountPercent !== undefined) row.discount_percent = input.discountPercent ?? null;
  if (input.promoPrice !== undefined) row.promo_price = input.promoPrice ?? null;
  if (input.startDate !== undefined) row.start_date = input.startDate;
  if (input.endDate !== undefined) row.end_date = input.endDate;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

export const subscriptionPromotionsRepo = {
  async all(): Promise<SubscriptionPromotion[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from("subscription_promotions").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map(toPromotion);
  },
  async list(params: QueryParams = {}): Promise<Paginated<SubscriptionPromotion>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    let q = sb.from("subscription_promotions").select("*", { count: "exact" });
    if (params.search) q = q.ilike("name", `%${params.search}%`);
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === "all") continue;
      q = q.eq(key, value);
    }
    const { data, count, error } = await q.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw error;
    return { data: (data as Row[]).map(toPromotion), total: count ?? 0, page, pageSize };
  },
  async create(input: SubscriptionPromotionInput): Promise<SubscriptionPromotion> {
    const sb = getSupabase();
    const payload = toRow({
      ...input,
      discountPercent: input.discountType === "percent" ? input.discountPercent : undefined,
      promoPrice: input.discountType === "fixed" ? input.promoPrice : undefined,
      status: input.status ?? "scheduled",
    });
    const { data, error } = await sb.from("subscription_promotions").insert(payload).select("*").single();
    if (error) throw error;
    return toPromotion(data as Row);
  },
  async update(id: string, patch: Partial<SubscriptionPromotion>): Promise<SubscriptionPromotion | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("subscription_promotions").update(toRow(patch)).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data ? toPromotion(data as Row) : null;
  },
  async setStatus(id: string, status: SubscriptionPromotion["status"]): Promise<SubscriptionPromotion | null> {
    return this.update(id, { status });
  },
  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("subscription_promotions").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
};
