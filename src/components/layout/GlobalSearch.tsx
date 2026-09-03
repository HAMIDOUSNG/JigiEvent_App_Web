"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/i18n/I18nProvider";
import { events, endUsers, organizations, admins, orders } from "@/mocks/data";
import { useAuthStore } from "@/store/auth";

interface Result {
  group: string;
  label: string;
  sub: string;
  href: string;
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const [query, setQuery] = useState("");

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  const results = useMemo<Result[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const isSA = role === "SUPER_ADMIN";
    const r: Result[] = [];
    events
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((e) => r.push({ group: "Événements", label: e.name, sub: e.organizationName, href: `/events/${e.id}` }));
    orders
      .filter((o) => o.reference.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((o) => r.push({ group: "Commandes", label: o.reference, sub: o.customerName, href: `/orders/${o.id}` }));
    if (isSA) {
      endUsers
        .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((u) => r.push({ group: "Utilisateurs", label: u.name, sub: u.email, href: `/users/${u.id}` }));
      admins
        .filter((a) => a.name.toLowerCase().includes(q) || a.organizationName.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((a) => r.push({ group: "Admins", label: a.name, sub: a.organizationName, href: `/admins/${a.id}` }));
      organizations
        .filter((o) => o.name.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((o) => r.push({ group: "Organisations", label: o.name, sub: o.city, href: `/organizations/${o.id}` }));
    }
    return r;
  }, [query, role]);

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    results.forEach((r) => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    });
    return Array.from(map.entries());
  }, [results]);

  function go(href: string) {
    router.push(href);
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <div className="-mx-5 -my-4">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <Search className="h-5 w-5 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.searchPlaceholder")}
            className="w-full bg-transparent text-body text-foreground outline-none placeholder:text-muted"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin p-2">
          {query && grouped.length === 0 && (
            <p className="px-3 py-8 text-center text-body-sm text-muted">{t("common.noResults")}</p>
          )}
          {!query && (
            <p className="px-3 py-8 text-center text-body-sm text-muted">
              {t("common.searchPlaceholder")}
            </p>
          )}
          {grouped.map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-3 py-1.5 text-label">{group}</p>
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => go(item.href)}
                  className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-left hover:bg-sand"
                >
                  <span>
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block text-caption">{item.sub}</span>
                  </span>
                  <CornerDownLeft className="h-3.5 w-3.5 text-muted" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
