import { getSupabase } from "@/api/supabase";
import type { QueryParams } from "@/services/helpers";
import type { Organization, Paginated } from "@/types";
import type { OrganizationInput } from "@/services";

// ============================================================
// Accès Supabase aux organisations.
// Mappe les colonnes snake_case (Postgres) vers le camelCase du front.
// ============================================================

type Row = {
  id: string;
  name: string;
  category_id: string;
  type: Organization["type"];
  country_code: string;
  region: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  admin_name: string;
  status: Organization["status"];
  events_count: number;
  revenue: number;
  logo: string | null;
  login_email: string | null;
  created_at: string;
};

function toOrganization(r: Row): Organization {
  return {
    id: r.id,
    name: r.name,
    categoryId: r.category_id,
    type: r.type,
    countryCode: r.country_code,
    region: r.region,
    city: r.city,
    address: r.address,
    phone: r.phone,
    email: r.email,
    adminName: r.admin_name,
    adminId: "",
    licenseId: "",
    status: r.status,
    eventsCount: r.events_count,
    revenue: r.revenue,
    createdAt: r.created_at,
    logo: r.logo ?? "",
    loginEmail: r.login_email ?? undefined,
  };
}

function toRow(input: Partial<OrganizationInput>) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.type !== undefined) row.type = input.type;
  if (input.countryCode !== undefined) row.country_code = input.countryCode;
  if (input.region !== undefined) row.region = input.region;
  if (input.city !== undefined) row.city = input.city;
  if (input.address !== undefined) row.address = input.address;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.email !== undefined) row.email = input.email;
  if (input.adminName !== undefined) row.admin_name = input.adminName;
  if (input.status !== undefined) row.status = input.status;
  if (input.logo !== undefined) row.logo = input.logo;
  if (input.loginEmail !== undefined) row.login_email = input.loginEmail;
  return row;
}

export const organizationsRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<Organization>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = sb.from("organizations").select("*", { count: "exact" });

    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`name.ilike.${s},email.ilike.${s},city.ilike.${s}`);
    }
    // Filtres exacts (ignore "all")
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === "all") continue;
      const column = key === "categoryId" ? "category_id" : key === "countryCode" ? "country_code" : key;
      q = q.eq(column, value);
    }
    if (params.sortBy) {
      const col = params.sortBy === "categoryId" ? "category_id" : params.sortBy;
      q = q.order(col, { ascending: params.sortDir !== "desc" });
    } else {
      q = q.order("revenue", { ascending: false });
    }

    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return {
      data: (data as Row[]).map(toOrganization),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Organization | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("organizations").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toOrganization(data as Row) : null;
  },

  async create(input: OrganizationInput): Promise<Organization> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("organizations")
      .insert(toRow(input))
      .select("*")
      .single();
    if (error) throw error;
    return toOrganization(data as Row);
  },

  async update(id: string, patch: Partial<OrganizationInput>): Promise<Organization | null> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("organizations")
      .update(toRow(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? toOrganization(data as Row) : null;
  },
};
