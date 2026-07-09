import { getTranslations, getLocale } from "next-intl/server";

interface BookingOverviewProps {
  job: any;
}

export default async function BookingOverview({ job }: BookingOverviewProps) {
  const t = await getTranslations("companionBookingDetails");
  const locale = await getLocale();

  // Unify overview description
  const overview = job.description || (locale === "ar" ? job.overviewAr : job.overview) || "";

  // Map database populated skills or fallback list (supporting both string and object)
  let skills: string[] = [];
  if (job.requiredSkills && job.requiredSkills.length > 0) {
    skills = job.requiredSkills.map((s: any) => typeof s === 'object' ? (locale === "ar" ? s.nameAr || s.nameEn : s.nameEn || s.nameAr) : s);
  } else {
    skills = locale === "ar" ? (job.requiredSkillsAr || []) : (job.requiredSkills || []);
  }

  // Derive preferred gender from database properties preferredGender or preferredCaregiverGender
  let preferredGender = "";
  const genderVal = job.preferredGender || job.preferredCaregiverGender;
  if (genderVal) {
    const lowerGender = genderVal.toLowerCase();
    if (lowerGender === "female") {
      preferredGender = t("female");
    } else if (lowerGender === "male") {
      preferredGender = t("male");
    } else {
      preferredGender = locale === "ar" ? "أي جنس" : "Any Gender";
    }
  } else if (job.beneficiary?.gender) {
    const gender = job.beneficiary.gender.toLowerCase();
    if (gender === "female") {
      preferredGender = locale === "ar" ? "يفضل أنثى" : "Female Preferred";
    } else if (gender === "male") {
      preferredGender = locale === "ar" ? "يفضل ذكر" : "Male Preferred";
    } else {
      preferredGender = locale === "ar" ? "أي جنس" : "Any Gender";
    }
  } else {
    preferredGender = locale === "ar" ? "أي جنس" : "Any Gender";
  }

  return (
    <div className="space-y-6">
      {/* Request Overview */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stitch-outline/10 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-stitch-on-surface border-b border-gray-50 pb-3">
          <span className="material-symbols-outlined text-stitch-primary">description</span>
          <h2 className="text-lg font-extrabold">{t("requestOverview")}</h2>
        </div>
        <p className="text-sm sm:text-base text-stitch-on-surface-variant/80 leading-relaxed text-justify">
          {overview}
        </p>
      </div>

      {/* Required Skills */}
      {skills.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stitch-outline/10 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-stitch-on-surface border-b border-gray-50 pb-3">
            <span className="material-symbols-outlined text-stitch-primary">construction</span>
            <h2 className="text-lg font-extrabold">{t("requiredSkills")}</h2>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-[#005f56]/10 text-[#005f56] text-xs font-bold px-4 py-2 rounded-xl"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stitch-outline/10 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-stitch-on-surface border-b border-gray-50 pb-3">
          <span className="material-symbols-outlined text-stitch-primary">settings_accessibility</span>
          <h2 className="text-lg font-extrabold">{t("preferences")}</h2>
        </div>
        <div className="pt-2">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-stitch-on-surface-variant/40 uppercase tracking-wider">
              {t("preferredGender")}
            </span>
            <span className="block text-sm font-extrabold text-stitch-on-surface">
              {preferredGender}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
