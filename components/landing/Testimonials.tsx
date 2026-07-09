import { getTranslations } from "next-intl/server";

export default async function Testimonials() {
  const t = await getTranslations("landing.testimonials");
  const testimonials = [
    { quote: t("one"), initials: "JD", name: t("oneName"), role: t("familyMember") },
    { quote: t("two"), initials: "LW", name: t("twoName"), role: t("caregiver"), highlighted: true },
    { quote: t("three"), initials: "MA", name: t("threeName"), role: t("familyMember") },
  ];

  return (
    <section className="py-24 bg-stitch-background overflow-hidden px-margin-mobile md:px-margin-desktop font-stitch-body" id="testimonials">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-stitch-on-surface text-center mb-16 font-stitch-display">{t("title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className={`bg-stitch-surface p-8 rounded-2xl shadow-soft ${testimonial.highlighted ? "border-2 border-stitch-primary/20" : ""}`}
            >
              <div className="flex gap-1 text-yellow-500 mb-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} className="material-symbols-outlined fill text-sm">star</span>
                ))}
              </div>
              <p className="text-stitch-on-surface-variant mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-stitch-primary/20 flex items-center justify-center font-bold text-stitch-primary font-stitch-display">{testimonial.initials}</div>
                <div>
                  <p className="font-bold text-sm text-stitch-on-surface">{testimonial.name}</p>
                  <p className="text-xs text-stitch-on-surface-variant">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
