import type { Paginated } from "@/types";

export interface QueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  filters?: Record<string, string | undefined>;
}

/** Apply text search across given fields. */
export function applySearch<T>(items: T[], search: string | undefined, fields: (keyof T)[]): T[] {
  if (!search) return items;
  const q = search.toLowerCase().trim();
  return items.filter((item) =>
    fields.some((f) => String(item[f] ?? "").toLowerCase().includes(q))
  );
}

/** Apply exact-match filters (skips "all"/empty). */
export function applyFilters<T>(items: T[], filters: Record<string, string | undefined> = {}): T[] {
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value || value === "all") return true;
      return String((item as Record<string, unknown>)[key]) === value;
    })
  );
}

export function applySort<T>(items: T[], sortBy?: string, dir: "asc" | "desc" = "asc"): T[] {
  if (!sortBy) return items;
  const sorted = [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

export function paginate<T>(items: T[], page = 1, pageSize = 10): Paginated<T> {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
