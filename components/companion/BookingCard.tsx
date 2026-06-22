import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

interface Skill {
  _id: string;
  nameAr: string;
  nameEn: string;
}

interface Tag {
  key: string;
  count?: number;
}

interface Job {
  _id?: string;
  id?: number | string;
  title?: string;
  titleKey?: string;
  description?: string;
  descKey?: string;
  serviceType?: string;
  categoryType?: string;
  categoryKey?: string;
  location?: {
    readableAddress?: string;
    city?: string;
    governorate?: string;
  };
  locationName?: string;
  budgetPerHour?: number;
  rate?: number;
  createdAt?: string;
  timeAgoKey?: string;
  timeAgoParams?: Record<string, any>;
  tags?: Tag[];
  requiredSkills?: Skill[];
  applicantsCount?: number;
  nearMe?: boolean;
}

interface BookingCardProps {
  job: Job;
}

export default async function BookingCard({ job }: BookingCardProps) {
  const t = await getTranslations("companionBookings");
  const tAny = t as any;
  const locale = await getLocale();

  // Unify ID
  const jobId = job._id || job.id;

  // Unify Title and Description
  const title = job.title || (job.titleKey ? tAny(job.titleKey) : "");
  const description = job.description || (job.descKey ? tAny(job.descKey) : "");

  // Unify Service / Care Type
  const categoryType = job.serviceType || job.categoryType || "";
  let categoryLabel = categoryType;
  try {
    categoryLabel = t(categoryType as any);
  } catch {
    categoryLabel = categoryType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Unify Location
  const locationName = job.location?.city || job.location?.governorate || job.locationName || "";

  // Unify Budget Rate
  const rate = job.budgetPerHour || job.rate || 0;

  // Calculate dynamic Time Ago if createdAt timestamp is present
  let timeAgo = "";
  if (job.createdAt) {
    const createdDate = new Date(job.createdAt);
    const diffMs = Date.now() - createdDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      timeAgo = locale === "ar" ? "الآن" : "Just now";
    } else if (diffHours === 1) {
      timeAgo = t("hoursAgoSingle");
    } else if (diffHours === 2) {
      timeAgo = t("hoursAgoTwo");
    } else if (diffHours < 24) {
      timeAgo = t("hoursAgo", { count: diffHours });
    } else {
      const diffDays = Math.floor(diffHours / 24);
      timeAgo = locale === "ar" ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
    }
  } else {
    timeAgo = job.timeAgoKey ? tAny(job.timeAgoKey, job.timeAgoParams) : "";
  }

  // Map database skills or mock tags
  let tagElements: { label: string }[] = [];
  if (job.requiredSkills && job.requiredSkills.length > 0) {
    tagElements = job.requiredSkills.map((skill) => ({
      label: locale === "ar" ? skill.nameAr : skill.nameEn,
    }));
  } else if (job.tags) {
    tagElements = job.tags.map((tag) => ({
      label: tAny(tag.key, tag.count !== undefined ? { count: tag.count } : undefined),
    }));
  }

  const applicantsCount = job.applicantsCount ?? 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft hover:shadow-medium hover:border-stitch-outline/25 transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-4 relative">
      {/* Top Row: Category, Location, and Time */}
      <div className="flex justify-between items-start text-xs font-semibold text-stitch-on-surface-variant/60">
        <div className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold">
          <span className="text-stitch-primary">{categoryLabel}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-xs leading-none">location_on</span>
            {locale === "ar" ? (locationName === "Riyadh" ? "الرياض" : locationName === "Jeddah" ? "جدة" : locationName) : locationName}
          </span>
          {job.nearMe && (
            <>
              <span>•</span>
              <span className="bg-[#005f56]/10 text-[#005f56] px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px] leading-none">near_me</span>
                {t("nearMe")}
              </span>
            </>
          )}
        </div>
        <span>{timeAgo}</span>
      </div>

      {/* Middle Row: Title and Rate */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2">
          <h2 className="text-lg font-extrabold text-stitch-on-surface leading-snug">
            {title}
          </h2>
          <p className="text-sm text-stitch-on-surface-variant/75 leading-relaxed">
            {description}{" "}
            <Link href={`/companion/bookings/${jobId}`} className="text-stitch-primary hover:text-stitch-primary/85 underline font-bold">
              {t("viewDetails")}
            </Link>
          </p>
        </div>

        {/* Price Rate */}
        <div className="text-right shrink-0">
          <span className="text-2xl font-extrabold text-stitch-primary">
            {t("perHour", { count: rate })}
          </span>
        </div>
      </div>

      {/* Bottom Row: Tags, Applicants, and Apply Now */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-50 mt-2">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tagElements.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold px-3 py-1.5 bg-gray-100/60 text-stitch-on-surface-variant/80 rounded-lg"
            >
              {tag.label}
            </span>
          ))}
        </div>

        {/* Applicants & Apply Button */}
        <div className="flex items-center gap-6 justify-between sm:justify-end">
          <span className="text-xs font-bold text-stitch-on-surface-variant/50 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm leading-none">group</span>
            {tAny(applicantsCount === 1 ? "applicant" : applicantsCount === 2 ? "applicantsTwo" : "applicants", { count: applicantsCount })}
          </span>
          <Link href={`/companion/bookings/${jobId}`} className="bg-[#005f56] hover:bg-[#004e46] text-white font-extrabold py-2.5 px-6 rounded-xl shadow-sm transition-colors text-sm cursor-pointer text-center block">
            {t("applyNow")}
          </Link>
        </div>
      </div>
    </div>
  );
}
