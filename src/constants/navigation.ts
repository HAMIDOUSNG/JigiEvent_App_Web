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
  labelAr?: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavSection {
  titleFr?: string;
  titleEn?: string;
  titleAr?: string;
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
        labelAr: "لوحة التحكم",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ALL,
      },
      {
        labelFr: "Mon organisation",
        labelEn: "My Organization",
        labelAr: "مؤسستي",
        href: "/my-organization",
        icon: Building,
        roles: ADM,
      },
    ],
  },
  {
    titleFr: "Gestion",
    titleEn: "Management",
    titleAr: "الإدارة",
    items: [
      { labelFr: "Utilisateurs", labelEn: "Users", labelAr: "المستخدمون", href: "/users", icon: Users, roles: SA },
      { labelFr: "Admins", labelEn: "Admins", labelAr: "المديرون", href: "/admins", icon: ShieldCheck, roles: SA },
      {
        labelFr: "Organisations",
        labelEn: "Organizations",
        labelAr: "المؤسسات",
        href: "/organizations",
        icon: Building2,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Événements",
    titleEn: "Events",
    titleAr: "الفعاليات",
    items: [
      {
        labelFr: "Événements",
        labelEn: "All Events",
        labelAr: "الفعاليات",
        href: "/events",
        icon: CalendarDays,
        roles: ALL,
      },
      { labelFr: "Catégories", labelEn: "Categories", labelAr: "الفئات", href: "/categories", icon: Tags, roles: SA },
      {
        labelFr: "Types d'événement",
        labelEn: "Event Types",
        labelAr: "أنواع الفعاليات",
        href: "/event-types",
        icon: Layers,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Billetterie",
    titleEn: "Ticketing",
    titleAr: "التذاكر",
    items: [
      { labelFr: "Billets", labelEn: "Tickets", labelAr: "التذاكر", href: "/tickets", icon: Ticket, roles: ALL },
      { labelFr: "Commandes", labelEn: "Orders", labelAr: "الطلبات", href: "/orders", icon: ShoppingCart, roles: ALL },
    ],
  },
  {
    titleFr: "Finance",
    titleEn: "Finance",
    titleAr: "المالية",
    items: [
      {
        labelFr: "Paiements",
        labelEn: "Payments",
        labelAr: "المدفوعات",
        href: "/payments",
        icon: CreditCard,
        roles: SA,
      },
      {
        labelFr: "Chiffre d'affaires",
        labelEn: "Revenue",
        labelAr: "الإيرادات",
        href: "/revenue",
        icon: TrendingUp,
        roles: ALL,
      },
      {
        labelFr: "Commissions",
        labelEn: "Commissions",
        labelAr: "العمولات",
        href: "/commissions",
        icon: Percent,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Licences",
    titleEn: "Licenses",
    titleAr: "التراخيص",
    items: [
      { labelFr: "Licences", labelEn: "Licenses", labelAr: "التراخيص", href: "/licenses", icon: KeyRound, roles: SA },
      {
        labelFr: "Plans d'abonnement",
        labelEn: "Subscription Plans",
        labelAr: "خطط الاشتراك",
        href: "/subscriptions",
        icon: BadgeCheck,
        roles: SA,
      },
      {
        labelFr: "Gestion des abonnements",
        labelEn: "Subscription Management",
        labelAr: "إدارة الاشتراكات",
        href: "/subscriptions/manage",
        icon: CreditCard,
        roles: SA,
      },
      {
        labelFr: "Promotions abonnement",
        labelEn: "Subscription Promotions",
        labelAr: "عروض الاشتراك",
        href: "/subscriptions/promotions",
        icon: Percent,
        roles: SA,
      },
    ],
  },
  {
    titleFr: "Marketing",
    titleEn: "Marketing",
    titleAr: "التسويق",
    items: [
      {
        labelFr: "Promotions",
        labelEn: "Promotions",
        labelAr: "العروض الترويجية",
        href: "/promotions",
        icon: Megaphone,
        roles: ALL,
      },
      {
        labelFr: "Notifications",
        labelEn: "Notifications",
        labelAr: "الإشعارات",
        href: "/notifications",
        icon: Bell,
        roles: ALL,
      },
    ],
  },
  {
    titleFr: "Contenu",
    titleEn: "Content",
    titleAr: "المحتوى",
    items: [
      {
        labelFr: "Articles",
        labelEn: "Articles",
        labelAr: "المقالات",
        href: "/articles",
        icon: Newspaper,
        roles: SA,
      },
      { labelFr: "Médias", labelEn: "Media", labelAr: "الوسائط", href: "/media", icon: ImageIcon, roles: SA },
    ],
  },
  {
    titleFr: "Rapports",
    titleEn: "Reports",
    titleAr: "التقارير",
    items: [
      {
        labelFr: "Analytique",
        labelEn: "Analytics",
        labelAr: "التحليلات",
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
        labelAr: "الإعدادات",
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
