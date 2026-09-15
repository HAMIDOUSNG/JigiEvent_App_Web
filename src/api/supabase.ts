import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Client Supabase (navigateur).
// Utilise l'URL du projet + la clé anon publique (jamais la clé
// service_role côté client). Les variables NEXT_PUBLIC_* sont
// exposées au navigateur — n'y mettez aucun secret sensible.
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Vrai si les variables Supabase sont configurées. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

/**
 * Retourne le client Supabase (singleton).
 * Lève une erreur explicite si les variables d'environnement manquent,
 * pour éviter des échecs silencieux difficiles à diagnostiquer.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase n'est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env, ou laissez NEXT_PUBLIC_USE_MOCKS=true."
    );
  }
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
