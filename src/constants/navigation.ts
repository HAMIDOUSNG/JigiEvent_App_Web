import type { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  CalendarDays,
  Tags,
  Layers,
  Ticket,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Percent,
  KeyRound,
  BadgeCheck,
  Megaphone,
  Bell,
  Newspaper,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Building,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  labelFr: string;
  labelEn: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavSection {
  titleFr?: string;
  titleEn?: string;
  items: NavItem[];
}

const ALL: Role[] = ["SUPER_ADMIN", "ADMIN"];
const SA: Role[] = ["SUPER_ADMIN"];
const ADM: Role[] = ["ADMIN"];

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        labelFr: "Tableau de bord",
        labelEn: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ALL,
      },
      {
        labelFr: "Mon organisation",
        labelEn: "My Organization",
        href: "/my-organization",
        icon: Building,
        roles: ADM,
      },
    ],
  },
  {
    titleFr: "Gestion",
    titleEn: "Management",
    items: [
      { labelFr: "Utilisateurs", labelEn: "Users", href: "/users", icon: Users, roles: SA },
      { labelFr: "Admins", labelEn: "Admins", href: "/admins", icon: ShieldCheck, roles: SA },
      {
        labelFr: "Organisations",
        labelEn: "Organizations",
        href: "/organizations",
        icon: Building2,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Événements",
    titleEn: "Events",
    items: [
      {
        labelFr: "Événements",
        labelEn: "All Events",
        href: "/events",
        icon: CalendarDays,
        roles: ALL,
      },
      { labelFr: "Catégories", labelEn: "Categories", href: "/categories", icon: Tags, roles: SA },
      {
        labelFr: "Types d'événement",
        labelEn: "Event Types",
        href: "/event-types",
        icon: Layers,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Billetterie",
    titleEn: "Ticketing",
    items: [
      { labelFr: "Billets", labelEn: "Tickets", href: "/tickets", icon: Ticket, roles: ALL },
      { labelFr: "Commandes", labelEn: "Orders", href: "/orders", icon: ShoppingCart, roles: ALL },
    ],
  },
  {
    titleFr: "Finance",
    titleEn: "Finance",
    items: [
      {
        labelFr: "Paiements",
        labelEn: "Payments",
        href: "/payments",
        icon: CreditCard,
        roles: SA,
      },
      {
        labelFr: "Chiffre d'affaires",
        labelEn: "Revenue",
        href: "/revenue",
        icon: TrendingUp,
        roles: ALL,
      },
      {
        labelFr: "Commissions",
        labelEn: "Commissions",
        href: "/commissions",
        icon: Percent,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Licences",
    titleEn: "Licenses",
    items: [
      { labelFr: "Licences", labelEn: "Licenses", href: "/licenses", icon: KeyRound, roles: SA },
      {
        labelFr: "Plans d'abonnement",
        labelEn: "Subscription Plans",
        href: "/subscriptions",
        icon: BadgeCheck,
        roles: SA,
      },
      {
        labelFr: "Gestion des abonnements",
        labelEn: "Subscription Management",
        href: "/subscriptions/manage",
        icon: CreditCard,
        roles: SA,
      },
      {
        labelFr: "Promotions abonnement",
        labelEn: "Subscription Promotions",
        href: "/subscriptions/promotions",
        icon: Percent,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Marketing",
    titleEn: "Marketing",
    items: [
      {
        labelFr: "Promotions",
        labelEn: "Promotions",
        href: "/promotions",
        icon: Megaphone,
        roles: ALL,
      },
      {
        labelFr: "Notifications",
        labelEn: "Notifications",
        href: "/notifications",
        icon: Bell,
        roles: ALL,
      },
    ],
  },
  {
    titleFr: "Contenu",
    titleEn: "Content",
    items: [
      {
        labelFr: "Articles",
        labelEn: "Articles",
        href: "/articles",
        icon: Newspaper,
        roles: SA,
      },
      { labelFr: "Médias", labelEn: "Media", href: "/media", icon: ImageIcon, roles: SA },
    ],
  },
  {
    titleFr: "Rapports",
    titleEn: "Reports",
    items: [
      {
        labelFr: "Analytique",
        labelEn: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        roles: SA,
      },
    ],
  },
  {
    items: [
      {
        labelFr: "Paramètres",
        labelEn: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ALL,
      },
    ],
  },
];

/** Filter nav sections by role, dropping empty sections. */
export function navForRole(role: Role): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}
