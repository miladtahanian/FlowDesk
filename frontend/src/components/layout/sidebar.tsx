"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout, hydrated } = useAuthStore();

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/workspaces", label: t("nav.workspaces"), icon: FolderKanban },
    { href: "/notifications", label: t("nav.notifications"), icon: Bell },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold">FlowDesk</span>
        )}
        <Button variant="ghost" size="icon" className="ml-auto" onClick={toggleSidebar}>
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon size={18} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t p-2">
        <div className={cn("flex items-center gap-3 rounded-md px-3 py-2", sidebarCollapsed && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium" suppressHydrationWarning>
            {hydrated ? (user?.full_name?.charAt(0) || "U") : "\u00A0"}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" suppressHydrationWarning>{hydrated ? (user?.full_name || "") : ""}</p>
              <p className="text-xs text-muted-foreground truncate" suppressHydrationWarning>{hydrated ? (user?.email || "") : ""}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
