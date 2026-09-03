"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Logo } from "@/components/layout/Logo";

export default function RootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(user ? "/dashboard" : "/login");
    }, 0);
    return () => clearTimeout(t);
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="skeleton h-1 w-32 rounded-full" />
      </div>
    </div>
  );
}
