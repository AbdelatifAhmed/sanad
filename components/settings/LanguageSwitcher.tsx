"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

const languageOptions: Array<{ value: AppLocale; labelKey: "english" | "arabic"; nativeName: string }> = [
  { value: "en", labelKey: "english", nativeName: "EN" },
  { value: "ar", labelKey: "arabic", nativeName: "AR" },
];

interface LanguageSwitcherProps {
  currentLocale: AppLocale;
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [nextLocale, setNextLocale] = useState<AppLocale | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!nextLocale) {
      return;
    }

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
    startTransition(() => {
      router.refresh();
    });
  }, [nextLocale, router]);

  return (
    <section className="rounded-2xl border border-stitch-outline/15 bg-sand-low/70 p-4">
      <div>
        <h3 className="font-bold text-stitch-on-surface">{t("language")}</h3>
        <p className="mt-1 text-sm leading-6 text-stitch-on-surface-variant/70">
          {t("languageDescription")}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {languageOptions.map((option) => {
          const isSelected = currentLocale === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setNextLocale(option.value)}
              disabled={isPending}
              aria-pressed={isSelected}
              className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-sm font-bold transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-70 ${
                isSelected
                  ? "border-stitch-primary bg-stitch-primary/10 text-stitch-primary"
                  : "border-stitch-outline/15 bg-stitch-surface text-stitch-on-surface hover:bg-stitch-secondary-container/15"
              }`}
            >
              <span>{t(option.labelKey)}</span>
              <span className="rounded-full bg-stitch-secondary-container px-2.5 py-1 text-xs text-stitch-on-secondary-container">
                {option.nativeName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
