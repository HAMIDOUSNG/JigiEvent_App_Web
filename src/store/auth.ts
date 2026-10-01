import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";
import { authAccounts } from "@/mocks/data";
import { apiConfig } from "@/api/client";
import { authRepo } from "@/api/repositories/auth";

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "authenticated";
  /** true tant que la session initiale n'a pas été restaurée. */
  hydrating: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  /** Restaure une éventuelle session Supabase au démarrage. */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "idle",
      hydrating: !apiConfig.useMocks,

      async login(email, password) {
        // --- Mode Supabase ---
        if (!apiConfig.useMocks) {
          const res = await authRepo.signIn(email, password);
          if (!res.ok || !res.user) {
            return { ok: false, error: res.error ?? "Identifiants invalides." };
          }
          set({ user: res.user, status: "authenticated" });
          return { ok: true };
        }

        // --- Mode mock ---
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
        if (!apiConfig.useMocks) {
          void authRepo.signOut();
        }
        set({ user: null, status: "idle" });
      },

      async hydrate() {
        if (apiConfig.useMocks) {
          set({ hydrating: false });
          return;
        }
        try {
          const user = await authRepo.currentUser();
          if (user) set({ user, status: "authenticated" });
          else set({ user: null, status: "idle" });
        } catch {
          set({ user: null, status: "idle" });
        } finally {
          set({ hydrating: false });
        }
      },
    }),
    {
      name: "horizon360.auth",
      // En mode Supabase, la session est gérée par Supabase lui-même :
      // on ne persiste l'utilisateur que pour le mode mock.
      partialize: (state) => (apiConfig.useMocks ? { user: state.user, status: state.status } : {}),
    }
  )
);
