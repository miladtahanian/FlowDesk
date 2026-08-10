"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User, Lock, Building2, Bell, Globe, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguageStore } from "@/stores/languageStore";

export default function SettingsPage() {
  const { isAuthenticated, user, tenant } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const { updateProfile, changePassword, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, hydrate } = useLanguageStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [mounted, setMounted] = useState(false);

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ full_name: fullName });
    } catch {}
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("validation.passwordMinLength"));
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {}
  };

  const handleSetTheme = (value: string) => {
    setTheme(value);
    toast.success(t("settings.appearance.themeSaved"));
  };

  const handleSetLanguage = (lang: "en" | "fa") => {
    setLanguage(lang);
    toast.success(t("settings.appearance.languageSaved"));
  };

  // hydrate client-only stores and theme
  useEffect(() => {
    setMounted(true);
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-6">{t("settings.title")}</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> {t("settings.profile.title")}
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> {t("settings.appearance.title")}
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> {t("settings.security")}
              </TabsTrigger>
              <TabsTrigger value="organization" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {t("settings.organization")}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> {t("settings.notifications")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.profile.title")}</CardTitle>
                  <CardDescription>{t("settings.profileDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold" suppressHydrationWarning>
                      {user?.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-medium" suppressHydrationWarning>{user?.full_name || ""}</p>
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>{user?.email || ""}</p>
                      <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                        @{user?.username || ""} | {t("settings.invitationCode")}: {user?.invitation_code || ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 max-w-md">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("auth.fullName")}</label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("auth.email")}</label>
                      <Input value={user?.email} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("auth.username")}</label>
                      <Input value={user?.username} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.role")}</label>
                      <Input value={user?.role} disabled className="capitalize" />
                    </div>
                  </div>

                  <Button onClick={handleUpdateProfile} disabled={loading}>
                    {loading ? t("common.saving") : t("common.save")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.appearance.title")}</CardTitle>
                  <CardDescription>{t("settings.appearance.appearanceDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 max-w-md">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.appearance.theme")}</label>
                      <div className="flex items-center gap-2">
                        {mounted && (
                          <>
                            <label className="cursor-pointer">
                              <input
                                type="radio"
                                name="theme"
                                className="sr-only peer"
                                checked={theme === "dark"}
                                onChange={() => handleSetTheme("dark")}
                              />
                              <span className="px-3 py-1 rounded border bg-card peer-checked:border-primary peer-checked:bg-primary/10">
                                {t("settings.appearance.darkMode")}
                              </span>
                            </label>

                            <label className="cursor-pointer">
                              <input
                                type="radio"
                                name="theme"
                                className="sr-only peer"
                                checked={theme === "light"}
                                onChange={() => handleSetTheme("light")}
                              />
                              <span className="px-3 py-1 rounded border bg-card peer-checked:border-primary peer-checked:bg-primary/10">
                                {t("settings.appearance.lightMode")}
                              </span>
                            </label>

                            <label className="cursor-pointer">
                              <input
                                type="radio"
                                name="theme"
                                className="sr-only peer"
                                checked={theme === "system"}
                                onChange={() => handleSetTheme("system")}
                              />
                              <span className="px-3 py-1 rounded border bg-card peer-checked:border-primary peer-checked:bg-primary/10">
                                {t("settings.appearance.systemMode")}
                              </span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.appearance.language")}</label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="language"
                            className="sr-only peer"
                            checked={language === "en"}
                            onChange={() => handleSetLanguage("en")}
                          />
                          <span className="px-3 py-1 rounded border bg-card peer-checked:border-primary peer-checked:bg-primary/10">English</span>
                        </label>

                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="language"
                            className="sr-only peer"
                            checked={language === "fa"}
                            onChange={() => handleSetLanguage("fa")}
                          />
                          <span className="px-3 py-1 rounded border bg-card peer-checked:border-primary peer-checked:bg-primary/10">فارسی</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.changePassword")}</CardTitle>
                  <CardDescription>{t("settings.securityDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 max-w-md">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.currentPassword")}</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.newPassword")}</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.confirmPassword")}</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={handleChangePassword} disabled={loading}>
                    {loading ? t("common.saving") : t("settings.changePassword")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t("settings.twoFactorAuth")}</CardTitle>
                  <CardDescription>{t("settings.twoFactorDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("settings.mfaStatus")}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.is_verified ? t("settings.enabled") : t("settings.disabled")}
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      {t("settings.setupMfa")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organization">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.organizationSettings")}</CardTitle>
                  <CardDescription>{t("settings.organizationDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 max-w-md">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.organizationName")}</label>
                      <Input value={tenant?.name || ""} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.slug")}</label>
                      <Input value={tenant?.slug || ""} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.plan")}</label>
                      <Input value={tenant?.plan || "free"} disabled className="capitalize" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("settings.maxMembers")}</label>
                      <Input value={tenant?.max_members || "10"} disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.notificationPreferences")}</CardTitle>
                  <CardDescription>{t("settings.notificationDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: t("settings.emailNotifications"), key: "email" },
                    { label: t("settings.taskAssignments"), key: "task_assign" },
                    { label: t("settings.projectUpdates"), key: "project_update" },
                    { label: t("settings.mentions"), key: "mentions" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <span className="text-sm">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
