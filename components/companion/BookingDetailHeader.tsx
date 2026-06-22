import { getTranslations, getLocale } from "next-intl/server";

interface BookingDetailHeaderProps {
  job: any;
}

export default async function BookingDetailHeader({ job }: BookingDetailHeaderProps) {
  const t = await getTranslations("companionBookingDetails");
  const tCommon = await getTranslations("companionBookings");
  const locale = await getLocale();

  // Unify category type
  const categoryType = job.serviceType || job.categoryType || "";
  let categoryLabel = categoryType;
  try {
    categoryLabel = tCommon(categoryType as any);
  } catch {
    categoryLabel = categoryType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  // Unify Title
  const title = job.title || (job.titleKey ? tCommon(job.titleKey as any) : "");

  // Unify Beneficiary/Recipient details
  const recipientName = job.beneficiary?.name || job.recipientName || "—";
  const recipientAge = job.beneficiary?.age || job.recipientAge || 0;

  // Unify Location
  const locationName = job.location?.city || job.location?.governorate || job.locationName || "";

  // Unify Rate
  const rate = job.budgetPerHour || job.rate || 0;
  const rateString = locale === "ar" ? `${rate}$/ساعة` : `$${rate}/hr`;

  // Calculate dynamic Time Ago if createdAt timestamp is present
  let timeAgo = "";
  if (job.createdAt) {
    const createdDate = new Date(job.createdAt);
    const diffMs = Date.now() - createdDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      timeAgo = locale === "ar" ? "الآن" : "Just now";
    } else if (diffHours === 1) {
      timeAgo = tCommon("hoursAgoSingle");
    } else if (diffHours === 2) {
      timeAgo = tCommon("hoursAgoTwo");
    } else if (diffHours < 24) {
      timeAgo = tCommon("hoursAgo", { count: diffHours });
    } else {
      const diffDays = Math.floor(diffHours / 24);
      timeAgo = locale === "ar" ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
    }
  } else {
    timeAgo = job.postedTimeAgoKey ? tCommon(job.postedTimeAgoKey as any, job.postedTimeAgoParams) : "";
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stitch-outline/10 shadow-soft flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-[#005f56]/10 text-[#005f56] text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider">
            {categoryLabel}
          </span>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-stitch-display font-extrabold text-stitch-on-surface leading-tight">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stitch-on-surface-variant/60 pt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">person</span>
              {t("recipient", { name: recipientName, age: recipientAge })}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">location_on</span>
              {locale === "ar" ? (locationName === "Riyadh" ? "الرياض" : locationName === "Jeddah" ? "جدة" : locationName) : locationName}
            </span>
          </div>
        </div>
      </div>

      <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#005f56]">
          {rateString}
        </span>
        <span className="text-xs font-semibold text-stitch-on-surface-variant/50">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}
