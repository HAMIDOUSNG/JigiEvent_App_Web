import { getSupabase } from "@/api/supabase";
import type { QueryParams } from "@/services/helpers";
import type { Order, Paginated, PaymentMethod, PaymentStatus, OrderStatus } from "@/types";

// ============================================================
// Accès Supabase aux commandes (migration 0007).
// Une commande appartient à un acheteur (auth.users) et à un
// événement. Le back-office (organisateur) lit les commandes de
// ses événements via une policy RLS dédiée (voir setup_rls_and_storage.sql).
//
// Certaines infos "client" (nom/email de l'acheteur) ne sont pas
// exposées au back-office : on les laisse vides plutôt que d'inventer.
// Le nombre de billets et le nom du porteur viennent de la table `tickets`.
// ============================================================

type OrderRow = {
  id: string;
  reference: string;
  user_id: string;
  event_id: string;
  subtotal: number;
  fees: number;
  total: number;
  currency: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  created_at: string;
  events: { title: string; organization_id: string } | null;
  tickets: { id: string; holder_name: string; qr_code_data: string }[] | null;
};

/** Le statut de commande fait aussi office de statut de paiement (schéma 0007). */
function toPaymentStatus(status: OrderStatus): PaymentStatus {
  switch (status) {
    case "paid":
      return "successful";
    case "cancelled":
      return "failed";
    default:
      return "pending";
  }
}

function toOrder(r: OrderRow): Order {
  const ticketList = r.tickets ?? [];
  const holder = ticketList.find((t) => t.holder_name)?.holder_name ?? "";
  return {
    id: r.id,
    reference: r.reference,
    customerName: holder,
    customerEmail: "",
    eventId: r.event_id,
    eventName: r.events?.title ?? "",
    organizationId: r.events?.organization_id ?? "",
    ticketsCount: ticketList.length,
    amount: r.total,
    paymentMethod: r.payment_method,
    paymentStatus: toPaymentStatus(r.status),
    status: r.status,
    createdAt: r.created_at,
    ticketCodes: ticketList.map((t) => t.qr_code_data),
  };
}

const SELECT = "*, events(title, organization_id), tickets(id, holder_name, qr_code_data)";

export const ordersRepo = {
  async list(params: QueryParams = {}): Promise<Paginated<Order>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;

    let q = sb.from("orders").select(SELECT, { count: "exact" });

    if (params.search) {
      const s = `%${params.search}%`;
      q = q.ilike("reference", s);
    }
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === "all") continue;
      if (key === "status") q = q.eq("status", value);
      if (key === "paymentMethod") q = q.eq("payment_method", value);
    }
    q = q.order("created_at", { ascending: params.sortDir !== "asc" });

    const { data, count, error } = await q.range(from, from + pageSize - 1);
    if (error) throw error;
    return {
      data: (data as OrderRow[]).map(toOrder),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Order | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("orders").select(SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toOrder(data as OrderRow) : null;
  },

  async byOrg(orgId: string, params: QueryParams = {}): Promise<Paginated<Order>> {
    const sb = getSupabase();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;

    // Filtre sur l'organisation via l'événement lié (jointure inner).
    let q = sb
      .from("orders")
      .select("*, events!inner(title, organization_id), tickets(id, holder_name, qr_code_data)", {
        count: "exact",
      })
      .eq("events.organization_id", orgId);

    if (params.search) q = q.ilike("reference", `%${params.search}%`);
    q = q.order("created_at", { ascending: false });

    const { data, count, error } = await q.range(from, from + pageSize - 1);
    if (error) throw error;
    return {
      data: (data as OrderRow[]).map(toOrder),
      total: count ?? 0,
      page,
      pageSize,
    };
  },
};
