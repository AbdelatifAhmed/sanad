"use client";

import { useTranslations } from "next-intl";
import { type ThemeMode, useTheme } from "@/components/providers/ThemeProvider";

const themeOptions: Array<{ value: ThemeMode; icon: string; labelKey: "light" | "dark" | "system" }> = [
  { value: "light", icon: "light_mode", labelKey: "light" },
  { value: "dark", icon: "dark_mode", labelKey: "dark" },
  { value: "system", icon: "desktop_windows", labelKey: "system" },
];

export default function ThemeSwitcher() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-2xl border border-stitch-outline/15 bg-sand-low/70 p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-bold text-stitch-on-surface">{t("theme")}</h3>
          <p className="mt-1 text-sm leading-6 text-stitch-on-surface-variant/70">
            {t("themeDescription")}
          </p>
        </div>
        <span className="hidden text-xs font-bold text-stitch-primary md:block">{t("saved")}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-stitch-surface p-1.5">
        {themeOptions.map((option) => {
          const isSelected = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={isSelected}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors cursor-pointer ${
                isSelected
                  ? "bg-stitch-primary text-stitch-on-primary shadow-sm"
                  : "text-stitch-on-surface-variant hover:bg-stitch-secondary-container/20 hover:text-stitch-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{option.icon}</span>
              <span className="truncate">{t(option.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
