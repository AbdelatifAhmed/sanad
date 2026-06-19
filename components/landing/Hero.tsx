import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Hero() {
  const t = await getTranslations("landing.hero");

  return (
    <section className="relative pt-16 pb-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto font-stitch-body">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-stitch-primary/10 text-stitch-primary px-4 py-2 rounded-full border border-stitch-primary/20">
            <span className="material-symbols-outlined text-[20px] fill">verified</span>
            <span className="text-sm font-bold uppercase tracking-wider">{t("badge")}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-stitch-on-surface font-stitch-display">
            {t("title")} <span className="text-stitch-primary">{t("titleAccent")}</span>
          </h1>

          <p className="text-xl text-stitch-on-surface-variant leading-relaxed max-w-xl">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              className="bg-stitch-primary text-stitch-on-primary px-8 py-4 rounded-xl font-bold text-lg text-center hover:scale-[1.02] transition-transform shadow-premium"
              href="/register?type=family"
            >
              {t("familyCta")}
            </Link>
            <Link
              className="bg-stitch-surface border-2 border-stitch-primary text-stitch-primary px-8 py-4 rounded-xl font-bold text-lg text-center hover:bg-stitch-primary/5 transition-colors"
              href="/register?type=companion"
            >
              {t("companionCta")}
            </Link>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              <Image
                alt="User Avatar 1"
                className="size-10 rounded-full border-2 border-stitch-surface object-cover"
                src="/avatar_1.jpg"
                width={40}
                height={40}
              />
              <Image
                alt="User Avatar 2"
                className="size-10 rounded-full border-2 border-stitch-surface object-cover"
                src="/avatar_2.jpg"
                width={40}
                height={40}
              />
              <Image
                alt="User Avatar 3"
                className="size-10 rounded-full border-2 border-stitch-surface object-cover"
                src="/avatar_3.jpg"
                width={40}
                height={40}
              />
            </div>
            <div className="text-sm text-stitch-on-surface-variant">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="font-bold text-stitch-on-surface ml-1 font-stitch-display">4.9/5</span>
              </div>
              <p>{t("rating")}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-stitch-primary/10 rounded-4xl transform rotate-2" />
          <Image
            alt="Compassionate Care for Elderly"
            className="relative w-full aspect-4/5 object-cover rounded-4xl shadow-premium"
            src="/hero-caregiver.png"
            width={500}
            height={625}
          />
          <div className="absolute -bottom-8 -right-8 bg-stitch-surface p-6 rounded-2xl shadow-premium border border-stitch-outline/20 max-w-xs animate-bounce-slow">
            <p className="text-stitch-primary font-bold text-lg mb-1 italic font-stitch-display">&ldquo;{t("quoteTitle")}&rdquo;</p>
            <p className="text-sm text-stitch-on-surface-variant">&ldquo;{t("quoteText")}&rdquo;</p>
            <p className="text-xs font-bold text-stitch-on-surface mt-2">- {t("quoteAuthor")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
