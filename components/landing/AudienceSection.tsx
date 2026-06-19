import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AudienceSection() {
  const t = await getTranslations("landing.audience");

  return (
    <section className="py-24 bg-stitch-background px-margin-mobile md:px-margin-desktop font-stitch-body">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-stitch-surface p-12 rounded-4xl shadow-soft flex flex-col justify-between hover:shadow-premium transition-shadow border border-stitch-outline/10">
          <div>
            <span className="text-stitch-primary font-bold tracking-widest text-xs uppercase mb-4 block">{t("families")}</span>
            <h3 className="text-3xl font-bold mb-6 font-stitch-display text-stitch-on-surface">{t("familiesTitle")}</h3>
            <ul className="space-y-4 mb-10 text-stitch-on-surface-variant">
              {[t("familiesItem1"), t("familiesItem2"), t("familiesItem3")].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            className="bg-stitch-primary text-stitch-on-primary px-8 py-4 rounded-xl font-bold text-center inline-block hover:opacity-90 transition-opacity"
            href="/register?type=family"
          >
            {t("familiesCta")}
          </Link>
        </div>

        <div className="bg-stitch-on-surface text-stitch-background p-12 rounded-4xl shadow-soft flex flex-col justify-between hover:shadow-premium transition-shadow">
          <div>
            <span className="text-stitch-primary font-bold tracking-widest text-xs uppercase mb-4 block">{t("caregivers")}</span>
            <h3 className="text-3xl font-bold mb-6 font-stitch-display">{t("caregiversTitle")}</h3>
            <ul className="space-y-4 mb-10 text-stitch-background/80">
              {[t("caregiversItem1"), t("caregiversItem2"), t("caregiversItem3")].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            className="bg-stitch-surface text-stitch-on-surface px-8 py-4 rounded-xl font-bold text-center inline-block hover:opacity-90 transition-opacity"
            href="/register?type=companion"
          >
            {t("caregiversCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
