"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ToastViewport } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/auth";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // Restaure la session Supabase au démarrage (no-op en mode mock).
    void hydrate();
  }, [hydrate]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {children}
        <ToastViewport />
      </I18nProvider>
    </QueryClientProvider>
  );
}
