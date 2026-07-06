"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { AppLocale } from "@/i18n/routing";
import { useAuthStore } from "@/store/authStore";
import type { AuthState, UserRole } from "@/types";

function getDashboardHref(role: UserRole | undefined) {
  if (role === "family") {
    return "/family/dashboard";
  }

  if (role === "companion") {
    return "/companion/dashboard";
  }

  return null;
}

export default function Header() {
  const t = useTranslations("landing.header");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state: AuthState) => state.user);
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nextLocale, setNextLocale] = useState<AppLocale | null>(null);
  const [isPending, startTransition] = useTransition();
  const dashboardHref = isAuthenticated ? getDashboardHref(user?.role) : null;

  useEffect(() => {
    if (!nextLocale) {
      return;
    }

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
    startTransition(() => router.refresh());
  }, [nextLocale, router]);

  const cycleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(nextTheme);
  };

  const switchLanguage = () => {
    setNextLocale(locale === "ar" ? "en" : "ar");
  };

  const themeIcon = theme === "dark" ? "dark_mode" : theme === "system" ? "desktop_windows" : "light_mode";

  const closeMenu = () => setMobileMenuOpen(false);

  const renderAuthButtons = (mobile = false) => {
    if (dashboardHref) {
      return (
        <Link
          className={
            mobile
              ? "bg-stitch-primary text-stitch-on-primary py-3 text-center rounded-lg font-semibold hover:shadow-lg transition-all"
              : "bg-stitch-primary text-stitch-on-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          }
          href={dashboardHref}
          onClick={mobile ? closeMenu : undefined}
        >
          {t("dashboard")}
        </Link>
      );
    }

    return (
      <>
        <Link
          className={
            mobile
              ? "text-stitch-primary font-semibold py-3 text-center border border-stitch-primary rounded-lg hover:bg-stitch-primary/5 transition-colors"
              : "text-stitch-primary font-semibold hover:opacity-80 transition-opacity px-4"
          }
          href="/login"
          onClick={mobile ? closeMenu : undefined}
        >
          {t("login")}
        </Link>
        <Link
          className={
            mobile
              ? "bg-stitch-primary text-stitch-on-primary py-3 text-center rounded-lg font-semibold hover:shadow-lg transition-all"
              : "bg-stitch-primary text-stitch-on-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          }
          href="/register"
          onClick={mobile ? closeMenu : undefined}
        >
          {t("getStarted")}
        </Link>
      </>
    );
  };

  const renderControls = (mobile = false) => (
    <div className={mobile ? "grid grid-cols-2 gap-3" : "flex items-center gap-2"}>
      <button
        type="button"
        aria-label={t("theme")}
        onClick={cycleTheme}
        className="flex h-11 items-center justify-center gap-2 rounded-lg border border-stitch-outline/25 bg-stitch-surface px-3 text-stitch-on-surface hover:text-stitch-primary transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-xl">{themeIcon}</span>
        {mobile && <span className="text-sm font-semibold">{theme}</span>}
      </button>
      <button
        type="button"
        aria-label={t("language")}
        onClick={switchLanguage}
        disabled={isPending}
        className="flex h-11 items-center justify-center rounded-lg border border-stitch-outline/25 bg-stitch-surface px-3 text-sm font-bold text-stitch-on-surface hover:text-stitch-primary transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-70"
      >
        {locale === "ar" ? "EN" : "AR"}
      </button>
    </div>
  );

  return (
    <header className="bg-stitch-surface/40 backdrop-blur-xl sticky top-0 z-50 border-b border-stitch-outline/10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] font-stitch-body transition-all duration-300">
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <Link className="flex items-center" href="/">
          <Image
            alt="Sanad Logo"
            className="size-12 w-auto object-contain"
            src="/logo_sanad.png"
            width={48}
            height={48}
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link className="text-stitch-on-surface font-medium hover:text-stitch-primary transition-colors" href="#how-it-works">
            {t("howItWorks")}
          </Link>
          <Link className="text-stitch-on-surface font-medium hover:text-stitch-primary transition-colors" href="#why-sanad">
            {t("whySanad")}
          </Link>
          <Link className="text-stitch-on-surface font-medium hover:text-stitch-primary transition-colors" href="#testimonials">
            {t("reviews")}
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {renderControls()}
          {renderAuthButtons()}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-stitch-on-surface hover:text-stitch-primary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={t("menu")}
        >
          <span className="material-symbols-outlined text-3xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stitch-surface border-b border-stitch-outline/20 px-margin-mobile py-6 flex flex-col gap-4 shadow-lg animate-fade-in">
          <Link 
            className="text-stitch-on-surface font-medium py-2 hover:text-stitch-primary transition-colors border-b border-stitch-outline/10"
            href="#how-it-works"
            onClick={closeMenu}
          >
            {t("howItWorks")}
          </Link>
          <Link 
            className="text-stitch-on-surface font-medium py-2 hover:text-stitch-primary transition-colors border-b border-stitch-outline/10"
            href="#why-sanad"
            onClick={closeMenu}
          >
            {t("whySanad")}
          </Link>
          <Link 
            className="text-stitch-on-surface font-medium py-2 hover:text-stitch-primary transition-colors border-b border-stitch-outline/10"
            href="#testimonials"
            onClick={closeMenu}
          >
            {t("reviews")}
          </Link>
          {renderControls(true)}
          <div className="flex flex-col gap-3 pt-2">
            {renderAuthButtons(true)}
          </div>
        </div>
      )}
    </header>
  );
}
