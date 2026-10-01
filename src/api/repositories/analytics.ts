import { getSupabase } from "@/api/supabase";
import type { TimeSeriesPoint, DistributionPoint } from "@/types";

// ============================================================
// Analytics & KPIs — lit les fonctions d'agrégation Supabase
// (voir supabase/analytics.sql). Les fonctions RPC sont
// `security definer` : elles agrègent au-delà de la RLS mais
// restent réservées aux utilisateurs authentifiés.
// ============================================================

// Palette pour colorer les graphes en anneau (donut).
const CHART_COLORS = [
  "#C65D3B", "#1F4D3A", "#C9A24B", "#2F6FB0", "#2E7D52", "#D98A29", "#9C4126",
];

function withColors<T extends { label: string; value: number }>(rows: T[]): DistributionPoint[] {
  return rows.map((r, i) => ({
    label: r.label,
    value: Number(r.value) ?? 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** Convertit les valeurs bigint (renvoyées en string par PostgREST) en number. */
function toNums<T extends Record<string, unknown>>(rows: T[], numKeys: string[]): TimeSeriesPoint[] {
  return rows.map((r) => {
    const out: Record<string, string | number | undefined> = { label: String(r.label) };
    for (const k of numKeys) out[k] = Number(r[k] ?? 0);
    return out as TimeSeriesPoint;
  });
}

/**
 * Appelle une fonction RPC. Si la fonction n'existe pas encore
 * (base non migrée — voir supabase/analytics.sql), on renvoie `fallback`
 * au lieu de faire planter toute la page.
 */
async function rpc<T>(fn: string, args: Record<string, unknown> | undefined, fallback: T): Promise<T> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc(fn, args);
  if (error) {
    // PGRST202 = fonction absente du schéma (migration analytics non appliquée).
    if (error.code === "PGRST202") {
      if (typeof console !== "undefined") {
        console.warn(
          `[analytics] Fonction "${fn}" absente. Exécutez supabase/analytics.sql pour activer les données réelles.`,
        );
      }
      return fallback;
    }
    throw error;
  }
  return (data as T) ?? fallback;
}

export interface SuperAdminKpis {
  totalUsers: number;
  totalAdmins: number;
  totalEvents: number;
  ticketsSold: number;
  totalRevenue: number;
  commission: number;
  activeLicenses: number;
  pendingEvents: number;
}

export interface SubscriptionKpis {
  totalCompanies: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  expiringSoon: number;
  subscriptionRevenue: number;
  activePromotions: number;
  publicationsByCompany: { organizationId: string; organizationName: string; publications: number }[];
}

export interface AdminKpis {
  myEvents: number;
  ticketsSold: number;
  revenue: number;
  pendingOrders: number;
  upcomingEvents: number;
  ticketsAvailable: number;
}

const EMPTY_SA_KPIS: SuperAdminKpis = {
  totalUsers: 0, totalAdmins: 0, totalEvents: 0, ticketsSold: 0,
  totalRevenue: 0, commission: 0, activeLicenses: 0, pendingEvents: 0,
};
const EMPTY_SUB_KPIS: SubscriptionKpis = {
  totalCompanies: 0, activeSubscriptions: 0, expiredSubscriptions: 0,
  expiringSoon: 0, subscriptionRevenue: 0, activePromotions: 0, publicationsByCompany: [],
};
const EMPTY_ADMIN_KPIS: AdminKpis = {
  myEvents: 0, ticketsSold: 0, revenue: 0, pendingOrders: 0, upcomingEvents: 0, ticketsAvailable: 0,
};

export const analyticsRepo = {
  // ---- KPIs ----
  superAdminKpis(): Promise<SuperAdminKpis> {
    return rpc<SuperAdminKpis>("sa_kpis", undefined, EMPTY_SA_KPIS);
  },
  subscriptionKpis(): Promise<SubscriptionKpis> {
    return rpc<SubscriptionKpis>("subscription_kpis", undefined, EMPTY_SUB_KPIS);
  },
  adminKpis(orgId: string): Promise<AdminKpis> {
    return rpc<AdminKpis>("admin_kpis", { org: orgId }, EMPTY_ADMIN_KPIS);
  },

  // ---- Séries temporelles ----
  async revenueOverTime(orgId?: string): Promise<TimeSeriesPoint[]> {
    const rows = await rpc<Record<string, unknown>[]>("revenue_over_time", { org: orgId ?? null }, []);
    return toNums(rows, ["value", "commission"]);
  },
  async ticketsOverTime(orgId?: string): Promise<TimeSeriesPoint[]> {
    const rows = await rpc<Record<string, unknown>[]>("tickets_over_time", { org: orgId ?? null }, []);
    return toNums(rows, ["sold", "available", "used"]);
  },
  async eventsBreakdown(): Promise<TimeSeriesPoint[]> {
    const rows = await rpc<Record<string, unknown>[]>("events_breakdown", undefined, []);
    return toNums(rows, ["created", "completed", "cancelled", "upcoming"]);
  },

  // ---- Distributions ----
  async revenueByCategory(): Promise<DistributionPoint[]> {
    const rows = await rpc<{ label: string; value: number }[]>("revenue_by_category", undefined, []);
    return withColors(rows);
  },
  async topOrganizations(): Promise<DistributionPoint[]> {
    const rows = await rpc<{ label: string; value: number }[]>("top_organizations", undefined, []);
    return withColors(rows);
  },
  async topEvents(orgId?: string): Promise<DistributionPoint[]> {
    const rows = await rpc<{ label: string; value: number }[]>("top_events", { org: orgId ?? null }, []);
    return withColors(rows);
  },
  async ticketDistribution(orgId?: string): Promise<DistributionPoint[]> {
    const rows = await rpc<{ label: string; value: number }[]>("ticket_distribution", { org: orgId ?? null }, []);
    return withColors(rows);
  },

  // ---- Non couvert par des données réelles (aucune géoloc utilisateur) ----
  usersByRegion(): Promise<DistributionPoint[]> {
    return Promise.resolve([]);
  },
};
