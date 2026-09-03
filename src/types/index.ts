// ============================================================
// HORIZON360 — Domain Types
// ============================================================

export type Role = "SUPER_ADMIN" | "ADMIN";

export type Locale = "fr" | "en";

// --- Auth / User (back-office account) ---
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  organizationId?: string;
  organizationName?: string;
}

// --- Status enums ---
export type EventStatus =
  | "draft"
  | "pending"
  | "published"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "rejected";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type PaymentStatus = "pending" | "successful" | "failed" | "refunded";

export type PaymentMethod = "orange_money" | "moov_money" | "bank_card" | "other";

export type LicenseStatus = "active" | "expiring_soon" | "expired" | "suspended";

export type EntityStatus = "active" | "suspended" | "pending";

export type OrgType = "private" | "public";

export type TicketStatus = "on_sale" | "sold_out" | "paused" | "ended";

export type PromotionStatus = "active" | "scheduled" | "ended" | "draft";

export type NotificationChannel = "push" | "sms" | "email" | "in_app";

export type ContentStatus = "draft" | "published" | "archived";

// --- Entities ---
export interface EndUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  ticketsPurchased: number;
  totalSpent: number;
  status: EntityStatus;
  createdAt: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  categoryId: string;
  type: OrgType;
  region: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  adminName: string;
  adminId: string;
  licenseId: string;
  status: EntityStatus;
  eventsCount: number;
  revenue: number;
  createdAt: string;
  logo?: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  organizationId: string;
  organizationName: string;
  categoryId: string;
  region: string;
  licenseType: string;
  licenseStatus: LicenseStatus;
  eventsCount: number;
  revenue: number;
  status: EntityStatus;
  createdAt: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  organizationsCount: number;
  eventsCount: number;
}

export interface EventType {
  id: string;
  name: string;
  description: string;
  eventsCount: number;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  saleStart: string;
  saleEnd: string;
  status: TicketStatus;
}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  organizationName: string;
  categoryId: string;
  eventTypeId: string;
  region: string;
  city: string;
  address: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  coverImage: string;
  ticketsSold: number;
  ticketsTotal: number;
  revenue: number;
  ordersCount: number;
  createdAt: string;
}

export interface Order {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  eventId: string;
  eventName: string;
  organizationId: string;
  ticketsCount: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  ticketCodes: string[];
}

export interface Payment {
  id: string;
  transactionId: string;
  orderId: string;
  orderRef: string;
  customerName: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

export interface License {
  id: string;
  organizationId: string;
  organizationName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: LicenseStatus;
  revenue: number;
}

export interface Promotion {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  applicableEvents: string;
  targetAudience: string;
  status: PromotionStatus;
  usageCount: number;
  organizationId?: string;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  audience: string;
  scheduledAt: string;
  status: "sent" | "scheduled" | "draft";
  reach: number;
}

export interface Article {
  id: string;
  title: string;
  cover: string;
  excerpt: string;
  author: string;
  category: string;
  status: ContentStatus;
  publishedDate: string;
  views: number;
}

// --- Analytics helpers ---
export interface TimeSeriesPoint {
  label: string;
  value?: number;
  [key: string]: string | number | undefined;
}

export interface DistributionPoint {
  label: string;
  value: number;
  color?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
