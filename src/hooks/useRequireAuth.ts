"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import type { Role } from "@/types";

/** Guards a page: redirects to /login if not authenticated,
 *  and to /dashboard if the role is not allowed. */
export function useRequireAuth(allowedRoles?: Role[]) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrating = useAuthStore((s) => s.hydrating);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Attend la fin de la restauration de session (Supabase) avant de décider.
    if (hydrating) return;

    const t = setTimeout(() => {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace("/dashboard");
        return;
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, [user, allowedRoles, router, hydrating]);

  return { user, ready: ready && !!user };
}
