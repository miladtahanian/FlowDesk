"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
