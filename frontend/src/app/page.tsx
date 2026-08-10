"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/stores/languageStore";
import {
  FolderKanban,
  Users,
  BarChart3,
  Bell,
  Shield,
  Globe,
  Zap,
  Layout,
  ArrowRight,
  Star,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [open, setOpen] = useState(false);

  const languages = [
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "fa" as const, label: "فارسی", flag: "🇮🇷" },
  ];

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
      >
        <span className="text-lg leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border bg-card shadow-lg overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  language === lang.code
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                }`}
              >
                <span className="text-lg leading-none">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, hydrated } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { dir } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, hydrated]);

  const features = [
    {
      icon: Layout,
      titleKey: "landing.featureKanbanTitle",
      descKey: "landing.featureKanbanDesc",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: FolderKanban,
      titleKey: "landing.featureWorkspaceTitle",
      descKey: "landing.featureWorkspaceDesc",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: Users,
      titleKey: "landing.featureCollabTitle",
      descKey: "landing.featureCollabDesc",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: BarChart3,
      titleKey: "landing.featureAnalyticsTitle",
      descKey: "landing.featureAnalyticsDesc",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: Bell,
      titleKey: "landing.featureNotifTitle",
      descKey: "landing.featureNotifDesc",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      icon: Shield,
      titleKey: "landing.featureRBACTitle",
      descKey: "landing.featureRBACDesc",
      color: "bg-red-500/10 text-red-500",
    },
    {
      icon: Globe,
      titleKey: "landing.featureI18nTitle",
      descKey: "landing.featureI18nDesc",
      color: "bg-cyan-500/10 text-cyan-500",
    },
    {
      icon: Zap,
      titleKey: "landing.featureFastTitle",
      descKey: "landing.featureFastDesc",
      color: "bg-yellow-500/10 text-yellow-500",
    },
  ];

  const stats = [
    { labelKey: "landing.statsActiveTeams", value: "2,500+" },
    { labelKey: "landing.statsTasksManaged", value: "150K+" },
    { labelKey: "landing.statsUptime", value: "99.9%" },
    { labelKey: "landing.statsCountries", value: "40+" },
  ];

  const steps = [
    { num: "1", titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
    { num: "2", titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
    { num: "3", titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
  ];

  const testimonials = [
    { quoteKey: "landing.testimonial1Quote", authorKey: "landing.testimonial1Author", roleKey: "landing.testimonial1Role" },
    { quoteKey: "landing.testimonial2Quote", authorKey: "landing.testimonial2Author", roleKey: "landing.testimonial2Role" },
    { quoteKey: "landing.testimonial3Quote", authorKey: "landing.testimonial3Author", roleKey: "landing.testimonial3Role" },
  ];

  return (
    <div className={`min-h-screen bg-background ${dir === "rtl" ? "rtl" : "ltr"}`} dir={dir}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">FlowDesk</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.seeFeatures")}
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.howItWorksTitle").split(" ").slice(0, 2).join(" ")}
              </a>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                {mounted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  </Button>
                )}
                <Link href="/login">
                  <Button variant="ghost">{t("auth.login")}</Button>
                </Link>
                <Link href="/register">
                  <Button>{t("landing.startFreeTrial")}</Button>
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              {t("landing.seeFeatures")}
            </a>
            <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              {t("landing.howItWorksTitle")}
            </a>
            <div className="flex items-center gap-2 py-2">
              <LanguageSwitcher />
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </Button>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">{t("auth.login")}</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button className="w-full">{t("landing.startFreeTrial")}</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>{t("landing.trusted")}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {t("landing.heroTitle1")}
              <br />
              <span className="text-primary">{t("landing.heroTitle2")}</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t("landing.heroDescription")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-base px-8 h-12">
                  {t("landing.startFreeTrial")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="text-base px-8 h-12">
                  {t("landing.seeFeatures")}
                </Button>
              </a>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              {t("landing.noCreditCard")}
            </p>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-muted-foreground">{t("landing.dashboardPreview")}</span>
              </div>
              <div className="p-6 bg-muted/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { labelKey: "landing.projects", value: "12", color: "text-blue-500" },
                    { labelKey: "landing.tasks", value: "84", color: "text-green-500" },
                    { labelKey: "landing.completed", value: "56", color: "text-emerald-500" },
                    { labelKey: "landing.team", value: "8", color: "text-purple-500" },
                  ].map((stat) => (
                    <div key={stat.labelKey} className="rounded-lg border bg-background p-4">
                      <p className="text-xs text-muted-foreground">{t(stat.labelKey)}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 rounded-lg border bg-background p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-sm">{t("landing.taskProgress")}</h4>
                      <span className="text-xs text-muted-foreground">67%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <h4 className="font-medium text-sm mb-3">{t("landing.activity")}</h4>
                    <div className="space-y-2">
                      {[t("landing.taskCompleted"), t("landing.newComment"), t("landing.memberJoined")].map((a) => (
                        <p key={a} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {a}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.featuresDescription")}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="group rounded-xl border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("landing.howItWorksTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.howItWorksDesc")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item) => (
              <div key={item.num} className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.num}
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(item.titleKey)}</h3>
                <p className="text-muted-foreground">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("landing.testimonialsTitle")}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="rounded-xl border bg-card p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{t(testimonial.quoteKey)}&rdquo;
                </p>
                <div>
                  <p className="font-semibold">{t(testimonial.authorKey)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(testimonial.roleKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary text-primary-foreground p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("landing.ctaTitle")}
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
                {t("landing.ctaDescription")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-base px-8 h-12"
                  >
                    {t("landing.getStartedFree")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-base px-8 h-12 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    {t("auth.login")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">FlowDesk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} FlowDesk. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.footerPrivacy")}
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("landing.footerTerms")}
              </a>
              <a
                href="https://github.com/miladtahanian/flowdesk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.footerGitHub")}
              </a>
              <a
                href="https://github.com/miladtahanian"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.footerAuthor")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
