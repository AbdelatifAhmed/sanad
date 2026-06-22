import { getTranslations, getLocale } from "next-intl/server";

interface BookingOverviewProps {
  job: any;
}

export default async function BookingOverview({ job }: BookingOverviewProps) {
  const t = await getTranslations("companionBookingDetails");
  const locale = await getLocale();

  // Unify overview description
  const overview = job.description || (locale === "ar" ? job.overviewAr : job.overview) || "";

  // Map database populated skills or fallback list
  let skills: string[] = [];
  if (job.requiredSkills && job.requiredSkills.length > 0) {
    skills = job.requiredSkills.map((s: any) => (locale === "ar" ? s.nameAr : s.nameEn));
  } else {
    skills = locale === "ar" ? (job.requiredSkillsAr || []) : (job.requiredSkills || []);
  }

  // Derive preferred gender from beneficiary gender details if preferences are not set
  let preferredGender = "";
  if (job.preferences?.preferredGender || job.preferences?.preferredGenderAr) {
    preferredGender = locale === "ar" ? job.preferences.preferredGenderAr : job.preferences.preferredGender;
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

  // Minimum Experience
  const minExperience = job.preferences?.minExperience || (locale === "ar" ? "1+ سنوات" : "1+ Years");
  
  // Background check
  const backgroundCheck = job.preferences?.backgroundCheck || (locale === "ar" ? "مطلوب" : "Required");

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

      {/* Preferences */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stitch-outline/10 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-stitch-on-surface border-b border-gray-50 pb-3">
          <span className="material-symbols-outlined text-stitch-primary">settings_accessibility</span>
          <h2 className="text-lg font-extrabold">{t("preferences")}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-stitch-on-surface-variant/40 uppercase tracking-wider">
              {t("preferredGender")}
            </span>
            <span className="block text-sm font-extrabold text-stitch-on-surface">
              {preferredGender}
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-stitch-on-surface-variant/40 uppercase tracking-wider">
              {t("minExperience")}
            </span>
            <span className="block text-sm font-extrabold text-stitch-on-surface">
              {minExperience}
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-stitch-on-surface-variant/40 uppercase tracking-wider">
              {t("backgroundCheck")}
            </span>
            <span className="block text-sm font-extrabold text-[#005f56]">
              {backgroundCheck}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
