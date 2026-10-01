import { getSupabase } from "@/api/supabase";

// ============================================================
// Upload de fichiers vers Supabase Storage.
// Bucket public "event-images" (voir supabase/setup_rls_and_storage.sql).
// L'upload est réservé aux utilisateurs connectés ; la lecture est
// publique (les URLs renvoyées sont directement utilisables par l'app
// mobile et le back-office).
// ============================================================

const BUCKET = "event-images";

/** Extension de fichier (sans le point), en minuscules. */
function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "bin";
}

/** Génère un chemin unique et sûr dans le bucket. */
function uniquePath(folder: string, file: File): string {
  const ext = fileExt(file.name);
  const rand = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return `${folder}/${rand}.${ext}`;
}

export const storageRepo = {
  /**
   * Téléverse une image et retourne son URL publique.
   * @param file   Fichier issu d'un <input type="file">.
   * @param folder Sous-dossier logique dans le bucket (ex. "covers").
   */
  async uploadImage(file: File, folder = "covers"): Promise<string> {
    const sb = getSupabase();
    const path = uniquePath(folder, file);

    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },
};
