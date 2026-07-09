import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function CTA() {
  const t = await getTranslations("landing.cta");

  return (
    <section className="py-24 bg-stitch-primary px-margin-mobile md:px-margin-desktop font-stitch-body">
      <div className="max-w-4xl mx-auto text-center text-stitch-on-primary">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 font-stitch-display">{t("title")}</h2>
        <p className="text-xl mb-12 opacity-90">{t("subtitle")}</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link 
            className="bg-white text-stitch-primary px-10 py-5 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all" 
            href="/register?type=family"
          >
            {t("family")}
          </Link>
          <Link 
            className="bg-transparent border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/10 transition-all" 
            href="/register?type=companion"
          >
            {t("companion")}
          </Link>
        </div>
      </div>
    </section>
  );
}
