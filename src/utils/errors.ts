import { toast } from "@/store/toast";

/** Message lisible à partir d'une erreur inconnue (Supabase, réseau, etc.). */
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (typeof err === "string" && err.trim()) return err;
  return "Une erreur inattendue est survenue.";
}

/**
 * Exécute une action asynchrone en affichant un toast en cas d'échec.
 * Renvoie true si succès, false si erreur — pratique pour piloter l'UI.
 */
export async function runWithToast(
  action: () => Promise<unknown>,
  opts: { errorTitle?: string } = {}
): Promise<boolean> {
  try {
    await action();
    return true;
  } catch (err) {
    toast.error(opts.errorTitle ?? "Échec de l'opération", errorMessage(err));
    return false;
  }
}
