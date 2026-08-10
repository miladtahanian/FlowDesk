"use client";

import { Search, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <div className="flex-1 flex items-center gap-2">
        <Search size={16} className="text-muted-foreground" />
        <Input
          placeholder={t("nav.searchPlaceholder")}
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value) {
              router.push(`/search?q=${encodeURIComponent(e.currentTarget.value)}`);
            }
          }}
        />
      </div>

      <Button variant="ghost" size="icon" onClick={() => router.push("/notifications")}>
        <Bell size={18} />
      </Button>

      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      )}
    </header>
  );
}
