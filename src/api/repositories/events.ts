import { getSupabase } from "@/api/supabase";
import type { QueryParams } from "@/services/helpers";
import type { Category, EventItem, Paginated, TicketType } from "@/types";
import type { EventInput, EventDbStatus, TicketTypeInput } from "@/services";

/** Type de billet enrichi du nom de l'événement et de son organisation. */
export type TicketTypeWithEvent = TicketType & {
  eventName: string;
  organizationId: string;
};

// ============================================================
// Accès Supabase au domaine Événements (migration 0007).
// Produit par le back-office web, consommé par l'app mobile.
// Mappe les colonnes snake_case (Postgres) vers le camelCase du front.
//
// Note : le back-office manipule `EventItem` (vue "gestion" avec
// organizationName, ticketsSold/Total, revenue…). Certaines de ces
// métriques (ventes, revenu) sont agrégées à la volée.
// ============================================================

type Row = {
  id: string;
  organization_id: string;
  category_id: string | null;
  title: string;
  description: string;
  cover_image_url: string;
  venue_city: string;
  venue_region: string;
  venue_address: string;
  start_date: string;
  end_date: string;
  status: "draft" | "upcoming" | "ongoing" | "past" | "cancelled";
  is_featured: boolean;
  is_promoted: boolean;
  created_at: string;
  // Colonnes agrégées de la vue events_public_view (lecture publique)
  organizer_name?: string | null;
};

/**
 * Statut base (`event_status`) -> statut back-office (`EventStatus`).
 * La base utilise `past` ; le type front n'a pas `past` mais `completed`.
 */
function mapStatus(dbStatus: Row["status"]): EventItem["status"] {
  return dbStatus === "past" ? "completed" : dbStatus;
}

function toEventItem(r: Row, metrics?: { sold: number; total: number; revenue: number; orders: number }): EventItem {
  return {
    id: r.id,
    name: r.title,
    description: r.description ?? "",
    organizationId: r.organization_id,
    organizationName: r.organizer_name ?? "",
    categoryId: r.category_id ?? "",
    eventTypeId: "",
    region: r.venue_region,
    city: r.venue_city,
    address: r.venue_address,
    startDate: r.start_date,
    endDate: r.end_date,
    status: mapStatus(r.status),
    coverImage: r.cover_image_url,
    ticketsSold: metrics?.sold ?? 0,
    ticketsTotal: metrics?.total ?? 0,
    revenue: metrics?.revenue ?? 0,
    ordersCount: metrics?.orders ?? 0,
    createdAt: r.created_at,
  };
}

/** Champs EventItem -> colonnes Postgres (pour insert/update). */
function toRow(input: Partial<EventInput>) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.title = input.name;
  if (input.description !== undefined) row.description = input.description;
  if (input.organizationId !== undefined) row.organization_id = input.organizationId;
  if (input.categoryId !== undefined) row.category_id = input.categoryId || null;
  if (input.region !== undefined) row.venue_region = input.region;
  if (input.city !== undefined) row.venue_city = input.city;
  if (input.address !== undefined) row.venue_address = input.address;
  if (input.venueName !== undefined) row.venue_name = input.venueName;
  if (input.startDate !== undefined) row.start_date = input.startDate;
  if (input.endDate !== undefined) row.end_date = input.endDate;
  if (input.coverImage !== undefined) row.cover_image_url = input.coverImage;
  if (input.status !== undefined) row.status = input.status;
  if (input.isFeatured !== undefined) row.is_featured = input.isFeatured;
  if (input.isPromoted !== undefined) row.is_promoted = input.isPromoted;
  return row;
}

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  price: number;
  available_quantity: number;
  max_per_order: number;
  description: string | null;
};

function toTicketType(r: TicketTypeRow, sold = 0): TicketType {
  return {
    id: r.id,
    eventId: r.event_id,
    name: r.name,
    price: r.price,
    quantity: r.available_quantity,
    sold,
    saleStart: "",
    saleEnd: "",
    status: r.available_quantity - sold <= 0 ? "sold_out" : "on_sale",
  };
}

export const eventsRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<EventItem>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;

    // On lit la vue publique (jointure organisateur incluse).
    let q = sb.from("events_public_view").select("*", { count: "exact" });

    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`title.ilike.${s},venue_city.ilike.${s},organizer_name.ilike.${s}`);
    }
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === "all") continue;
      const column = key === "categoryId" ? "category_id" : key === "organizationId" ? "organization_id" : key;
      q = q.eq(column, value);
    }
    const sortCol = params.sortBy === "startDate" ? "start_date" : params.sortBy ?? "start_date";
    q = q.order(sortCol, { ascending: params.sortDir !== "desc" });

    const { data, count, error } = await q.range(from, from + pageSize - 1);
    if (error) throw error;
    return { data: (data as Row[]).map((r) => toEventItem(r)), total: count ?? 0, page, pageSize };
  },

  async get(id: string): Promise<EventItem | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("events_public_view").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toEventItem(data as Row) : null;
  },

  async byOrg(orgId: string): Promise<EventItem[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("events_public_view")
      .select("*")
      .eq("organization_id", orgId)
      .order("start_date", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map((r) => toEventItem(r));
  },

  async ticketsFor(eventId: string): Promise<TicketType[]> {
    const sb = getSupabase();
    // Back-office : on ne montre que les billets actifs pour l'édition
    // (les billets désactivés restent en base pour l'historique).
    const { data, error } = await sb
      .from("ticket_types")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("price", { ascending: true });
    if (error) throw error;
    return (data as TicketTypeRow[]).map((r) => toTicketType(r));
  },

  /**
   * Tous les types de billets, enrichis du nom de l'événement et de son
   * organisation, avec le nombre vendu (table `tickets`). Utilisé par la
   * page "Billets" (vue globale). La RLS limite déjà les lignes visibles
   * à l'organisation de l'utilisateur (ou tout, pour un Super Admin).
   */
  async allTicketTypes(): Promise<TicketTypeWithEvent[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("ticket_types")
      .select("*, events(title, organization_id)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data as (TicketTypeRow & {
      events: { title: string; organization_id: string } | null;
    })[]) ?? [];

    // Nombre vendu par type de billet (une ligne `tickets` = un billet émis).
    const ids = rows.map((r) => r.id);
    const soldByType = new Map<string, number>();
    if (ids.length > 0) {
      const { data: sales, error: salesErr } = await sb
        .from("tickets")
        .select("ticket_type_id")
        .in("ticket_type_id", ids);
      if (salesErr) throw salesErr;
      for (const s of (sales as { ticket_type_id: string }[]) ?? []) {
        soldByType.set(s.ticket_type_id, (soldByType.get(s.ticket_type_id) ?? 0) + 1);
      }
    }

    return rows.map((r) => ({
      ...toTicketType(r, soldByType.get(r.id) ?? 0),
      eventName: r.events?.title ?? "",
      organizationId: r.events?.organization_id ?? "",
    }));
  },

  async create(input: EventInput): Promise<EventItem> {
    const sb = getSupabase();
    const { data, error } = await sb.from("events").insert(toRow(input)).select("*").single();
    if (error) throw error;
    // La ligne insérée n'a pas les colonnes de la vue (organizer_name) :
    // on recharge depuis la vue si l'événement est publié, sinon on renvoie tel quel.
    const created = data as Row;
    return toEventItem(created);
  },

  async update(id: string, patch: Partial<EventInput>): Promise<EventItem | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("events").update(toRow(patch)).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data ? toEventItem(data as Row) : null;
  },

  async setStatus(id: string, status: EventDbStatus): Promise<EventItem | null> {
    return this.update(id, { status });
  },

  async remove(id: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb.from("events").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },

  /** Catégories réelles (id + nom) pour alimenter les sélecteurs. */
  async categories(): Promise<{ id: string; name: string }[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from("categories").select("id, name").order("name", { ascending: true });
    if (error) throw error;
    return (data as { id: string; name: string }[]) ?? [];
  },

  /**
   * Catégories complètes pour la page "Catégories" (nom, icône, +
   * nombre d'événements par catégorie). La table `categories` n'a pas de
   * description ni de compteur d'organisations : ces champs sont dérivés
   * ou laissés à 0.
   */
  async categoriesFull(): Promise<Category[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("categories")
      .select("id, name, icon")
      .order("name", { ascending: true });
    if (error) throw error;
    const cats = (data as { id: string; name: string; icon: string | null }[]) ?? [];

    // Nombre d'événements par catégorie (une requête, agrégée côté client).
    const { data: evRows, error: evErr } = await sb
      .from("events")
      .select("category_id");
    if (evErr) throw evErr;
    const countByCat = new Map<string, number>();
    for (const r of (evRows as { category_id: string | null }[]) ?? []) {
      if (r.category_id) countByCat.set(r.category_id, (countByCat.get(r.category_id) ?? 0) + 1);
    }

    return cats.map((c) => ({
      id: c.id,
      name: c.name,
      description: "",
      icon: c.icon ?? "",
      organizationsCount: 0,
      eventsCount: countByCat.get(c.id) ?? 0,
    }));
  },

  /** Ajoute un type de billet à un événement. */
  async addTicketType(eventId: string, input: TicketTypeInput): Promise<TicketType> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("ticket_types")
      .insert({
        event_id: eventId,
        name: input.name,
        price: input.price,
        available_quantity: input.quantity,
        max_per_order: input.maxPerOrder ?? 10,
        description: input.description ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toTicketType(data as TicketTypeRow);
  },

  /** Met à jour un type de billet existant. */
  async updateTicketType(ticketTypeId: string, patch: Partial<TicketTypeInput>): Promise<TicketType | null> {
    const sb = getSupabase();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.quantity !== undefined) row.available_quantity = patch.quantity;
    if (patch.maxPerOrder !== undefined) row.max_per_order = patch.maxPerOrder;
    if (patch.description !== undefined) row.description = patch.description ?? null;
    const { data, error } = await sb
      .from("ticket_types")
      .update(row)
      .eq("id", ticketTypeId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? toTicketType(data as TicketTypeRow) : null;
  },

  /** Désactive un type de billet (retiré de la vente, conservé en base). */
  async deactivateTicketType(ticketTypeId: string): Promise<{ ok: true }> {
    const sb = getSupabase();
    const { error } = await sb
      .from("ticket_types")
      .update({ is_active: false })
      .eq("id", ticketTypeId);
    if (error) throw error;
    return { ok: true };
  },

  /** True si au moins un billet a été émis pour ce type. */
  async ticketTypeHasSales(ticketTypeId: string): Promise<boolean> {
    const sb = getSupabase();
    const { count, error } = await sb
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("ticket_type_id", ticketTypeId);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  /**
   * Retire un type de billet. S'il n'a jamais été vendu, il est SUPPRIMÉ ;
   * sinon il est DÉSACTIVÉ (préservation de l'historique de vente).
   * Retourne l'action effectivement réalisée.
   */
  async removeTicketType(ticketTypeId: string): Promise<{ ok: true; action: "deleted" | "deactivated" }> {
    const sb = getSupabase();
    const hasSales = await this.ticketTypeHasSales(ticketTypeId);
    if (hasSales) {
      await this.deactivateTicketType(ticketTypeId);
      return { ok: true, action: "deactivated" };
    }
    const { error } = await sb.from("ticket_types").delete().eq("id", ticketTypeId);
    if (error) {
      // Filet de sécurité : si la suppression échoue (FK), on désactive.
      await this.deactivateTicketType(ticketTypeId);
      return { ok: true, action: "deactivated" };
    }
    return { ok: true, action: "deleted" };
  },
};
