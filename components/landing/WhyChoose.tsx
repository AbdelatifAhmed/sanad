import { getTranslations } from "next-intl/server";

export default async function WhyChoose() {
  const t = await getTranslations("landing.why");
  const cards = [
    { icon: "verified_user", title: t("verifiedTitle"), text: t("verifiedText") },
    { icon: "lock", title: t("chatTitle"), text: t("chatText") },
    { icon: "event_available", title: t("bookingTitle"), text: t("bookingText") },
    { icon: "groups", title: t("communityTitle"), text: t("communityText") },
  ];

  return (
    <section className="py-24 bg-stitch-surface px-margin-mobile md:px-margin-desktop font-stitch-body" id="why-sanad">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-stitch-on-surface mb-4 font-stitch-display">{t("title")}</h2>
          <p className="text-stitch-on-surface-variant max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="p-8 rounded-2xl bg-stitch-background hover:bg-stitch-primary/5 transition-colors group duration-300">
              <span className="material-symbols-outlined text-[32px] text-stitch-primary mb-4 block fill">{card.icon}</span>
              <h4 className="text-lg font-bold mb-2 font-stitch-display text-stitch-on-surface">{card.title}</h4>
              <p className="text-stitch-on-surface-variant text-sm">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
