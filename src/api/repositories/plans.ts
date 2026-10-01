import { getSupabase } from "@/api/supabase";
import type { QueryParams } from "@/services/helpers";
import type { SubscriptionPlan, Paginated } from "@/types";
import type { PlanInput } from "@/services";

type Row = {
  id: string;
  name: string;
  period: SubscriptionPlan["period"];
  price: number;
  description: string;
  features: string[] | null;
  status: SubscriptionPlan["status"];
  created_at: string;
};

function toPlan(r: Row): SubscriptionPlan {
  return {
    id: r.id,
    name: r.name,
    period: r.period,
    price: r.price,
    description: r.description ?? "",
    features: r.features ?? [],
    status: r.status,
    createdAt: r.created_at,
  };
}

function toRow(input: Partial<PlanInput>) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.period !== undefined) row.period = input.period;
  if (input.price !== undefined) row.price = input.price;
  if (input.description !== undefined) row.description = input.description;
  if (input.features !== undefined) row.features = input.features;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

export const plansRepo = {
  async all(): Promise<SubscriptionPlan[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from("subscription_plans").select("*").order("price", { ascending: true });
    if (error) throw error;
    return (data as Row[]).map(toPlan);
  },
  async list(params: QueryParams = {}): Promise<Paginated<SubscriptionPlan>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    let q = sb.from("subscription_plans").select("*", { count: "exact" });
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`name.ilike.${s},description.ilike.${s}`);
    }
    const { data, count, error } = await q.order("price", { ascending: true }).range(from, from + pageSize - 1);
    if (error) throw error;
    return { data: (data as Row[]).map(toPlan), total: count ?? 0, page, pageSize };
  },
  async get(id: string): Promise<SubscriptionPlan | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("subscription_plans").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toPlan(data as Row) : null;
  },
  async create(input: PlanInput): Promise<SubscriptionPlan> {
    const sb = getSupabase();
    const { data, error } = await sb.from("subscription_plans").insert(toRow(input)).select("*").single();
    if (error) throw error;
    return toPlan(data as Row);
  },
  async update(id: string, patch: Partial<PlanInput>): Promise<SubscriptionPlan | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("subscription_plans").update(toRow(patch)).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data ? toPlan(data as Row) : null;
  },
  async setStatus(id: string, status: SubscriptionPlan["status"]): Promise<SubscriptionPlan | null> {
    return this.update(id, { status });
  },
  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("subscription_plans").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
};
