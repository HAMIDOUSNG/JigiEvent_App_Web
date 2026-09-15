import { getSupabase } from "@/api/supabase";
import type { AuthUser, Role } from "@/types";

// ============================================================
// Authentification Supabase.
// Combine auth.users (session) et la table `profiles` (rôle,
// organisation) pour construire l'AuthUser attendu par le front.
// ============================================================

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization_id: string | null;
};

async function loadAuthUser(userId: string, fallbackEmail: string): Promise<AuthUser> {
  const sb = getSupabase();
  const { data: profile } = await sb
    .from("profiles")
    .select("id, name, email, role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  const p = profile as ProfileRow | null;

  let organizationName: string | undefined;
  if (p?.organization_id) {
    const { data: org } = await sb
      .from("organizations")
      .select("name")
      .eq("id", p.organization_id)
      .maybeSingle();
    organizationName = (org as { name: string } | null)?.name ?? undefined;
  }

  return {
    id: userId,
    name: p?.name || fallbackEmail,
    email: p?.email || fallbackEmail,
    role: p?.role ?? "ADMIN",
    organizationId: p?.organization_id ?? undefined,
    organizationName,
  };
}

export const authRepo = {
  async signIn(email: string, password: string): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Identifiants invalides." };
    }
    const user = await loadAuthUser(data.user.id, data.user.email ?? email);
    return { ok: true, user };
  },

  async signOut(): Promise<void> {
    await getSupabase().auth.signOut();
  },

  /** Restaure l'utilisateur si une session Supabase est active. */
  async currentUser(): Promise<AuthUser | null> {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    if (!data.session?.user) return null;
    return loadAuthUser(data.session.user.id, data.session.user.email ?? "");
  },
};
