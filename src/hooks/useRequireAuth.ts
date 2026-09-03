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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Allow zustand persist to hydrate before deciding
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
  }, [user, allowedRoles, router]);

  return { user, ready: ready && !!user };
}
