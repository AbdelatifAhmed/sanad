import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";
import SettingsInfoCard from "./SettingsInfoCard";
import ThemeSwitcher from "./ThemeSwitcher";

export type SettingsRole = "family" | "companion";

interface SettingsPageProps {
  role: SettingsRole;
}

export default async function SettingsPage({ role }: SettingsPageProps) {
  const t = await getTranslations("settings");
  const locale = (await getLocale()) as AppLocale;
  const isFamily = role === "family";

  const infoCards = [
    {
      icon: "account_circle",
      title: t("account"),
      description: t("accountDescription"),
    },
    {
      icon: "shield",
      title: t("security"),
      description: t("securityDescription"),
    },
    {
      icon: "notifications",
      title: t("notifications"),
      description: t("notificationsDescription"),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12 font-stitch-body">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-stitch-outline/20 bg-stitch-surface px-3 py-1 text-xs font-semibold text-stitch-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-base">workspace_premium</span>
            <span>{t("currentRole")}: {isFamily ? t("familyRole") : t("companionRole")}</span>
          </div>
          <div>
            <h1 className="font-stitch-display text-3xl font-bold tracking-tight text-stitch-on-surface md:text-4xl">
              {isFamily ? t("familyTitle") : t("companionTitle")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stitch-on-surface-variant/75">
              {isFamily ? t("familySubtitle") : t("companionSubtitle")}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-3xl border border-stitch-outline/15 bg-stitch-surface p-5 shadow-soft md:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stitch-primary/10 text-stitch-primary">
              <span className="material-symbols-outlined">tune</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-stitch-on-surface">{t("preferences")}</h2>
              <p className="mt-1 text-sm leading-6 text-stitch-on-surface-variant/70">
                {t("preferencesDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <ThemeSwitcher />
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>

        <aside className="grid gap-4">
          {infoCards.map((card) => (
            <SettingsInfoCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              description={card.description}
              badge={t("comingSoon")}
            />
          ))}
        </aside>
      </section>
    </div>
  );
}
