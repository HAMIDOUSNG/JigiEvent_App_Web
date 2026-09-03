import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";
import { authAccounts } from "@/mocks/data";

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "authenticated";
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "idle",
      async login(email, password) {
        // Simulated auth latency
        await new Promise((r) => setTimeout(r, 600));
        const account = authAccounts.find(
          (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
        );
        if (!account) {
          return { ok: false, error: "Identifiants invalides." };
        }
        const user: AuthUser = {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          organizationId: "organizationId" in account ? account.organizationId : undefined,
          organizationName: account.organizationName,
        };
        set({ user, status: "authenticated" });
        return { ok: true };
      },
      logout() {
        set({ user: null, status: "idle" });
      },
    }),
    {
      name: "horizon360.auth",
    }
  )
);
