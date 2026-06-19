import { getTranslations } from "next-intl/server";

export default async function Stats() {
  const t = await getTranslations("landing.stats");

  return (
    <section className="bg-stitch-primary py-12 font-stitch-body">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-stitch-on-primary">
          <div>
            <p className="text-4xl font-bold mb-1 font-stitch-display">5,000+</p>
            <p className="text-white/80 text-sm font-medium">{t("caregivers")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-1 font-stitch-display">12,000+</p>
            <p className="text-white/80 text-sm font-medium">{t("families")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-1 font-stitch-display">98%</p>
            <p className="text-white/80 text-sm font-medium">{t("satisfaction")}</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-1 font-stitch-display">24/7</p>
            <p className="text-white/80 text-sm font-medium">{t("support")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
