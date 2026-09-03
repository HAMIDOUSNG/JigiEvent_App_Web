import type { TimeSeriesPoint, DistributionPoint } from "@/types";
import { categories, organizations, events, REGIONS } from "./data";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export const revenueOverTime: TimeSeriesPoint[] = MONTHS.map((m, i) => ({
  label: m,
  value: 8_000_000 + Math.round(Math.sin(i / 2) * 3_500_000 + i * 1_400_000),
  commission: Math.round((8_000_000 + i * 1_400_000) * 0.12),
}));

export const ticketsOverTime: TimeSeriesPoint[] = MONTHS.map((m, i) => ({
  label: m,
  sold: 1_200 + i * 180 + Math.round(Math.cos(i) * 300),
  available: 3_000 - i * 60,
  used: 900 + i * 150,
}));

export const eventsBreakdown: TimeSeriesPoint[] = MONTHS.slice(3).map((m, i) => ({
  label: m,
  created: 4 + (i % 4),
  completed: 2 + (i % 3),
  cancelled: i % 3 === 0 ? 1 : 0,
  upcoming: 3 + (i % 2),
}));

export const usersByRegion: DistributionPoint[] = REGIONS.map((r, i) => ({
  label: r,
  value: 320 + (i * 137) % 900,
}));

const CHART_COLORS = ["#C65D3B", "#1F4D3A", "#C9A24B", "#2F6FB0", "#2E7D52", "#D98A29", "#9C4126"];

export const revenueByCategory: DistributionPoint[] = categories.slice(0, 6).map((c, i) => ({
  label: c.name,
  value: c.eventsCount * 1_450_000,
  color: CHART_COLORS[i % CHART_COLORS.length],
}));

export const ticketDistribution: DistributionPoint[] = [
  { label: "VIP", value: 28, color: "#C65D3B" },
  { label: "Standard", value: 52, color: "#1F4D3A" },
  { label: "Early Bird", value: 20, color: "#C9A24B" },
];

export const topOrganizations = [...organizations]
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 5)
  .map((o) => ({ label: o.name, value: o.revenue }));

export const topEvents = [...events]
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 5)
  .map((e) => ({ label: e.name, value: e.revenue }));
