import { getTranslations, getLocale } from "next-intl/server";
import SharedMap from "@/components/shared/SharedMap";

interface BookingSidebarProps {
  job: any;
}

export default async function BookingSidebar({ job }: BookingSidebarProps) {
  const t = await getTranslations("companionBookingDetails");
  const locale = await getLocale();

  const rawCoords = job.location?.geo?.coordinates;
  const mapCenter: [number, number] = rawCoords && rawCoords.length === 2
    ? [rawCoords[1], rawCoords[0]] // [lat, lng]
    : [24.7136, 46.6753]; // Fallback to Riyadh

  // Unify Location Address
  const locationAddress = job.location?.readableAddress || job.locationAddress || "";
  const approxDistance = job.approxDistance || null;

  // Parse Schedule Weekdays
  const daysArray = job.schedule?.workingDays || [];
  const scheduleDaysEn = daysArray.join(", ");
  const dayMappings: Record<string, string> = {
    "Sunday": "الأحد",
    "Monday": "الإثنين",
    "Tuesday": "الثلاثاء",
    "Wednesday": "الأربعاء",
    "Thursday": "الخميس",
    "Friday": "الجمعة",
    "Saturday": "السبت"
  };
  const scheduleDaysAr = daysArray.map((d: string) => dayMappings[d] || d).join("، ");
  const scheduleDays = locale === "ar" ? (scheduleDaysAr || job.scheduleDaysAr) : (scheduleDaysEn || job.scheduleDays);

  // Parse Shift Times
  let scheduleTimes = "";
  if (job.schedule?.startTime && job.schedule?.endTime) {
    scheduleTimes = `${job.schedule.startTime} - ${job.schedule.endTime}`;
  } else {
    scheduleTimes = job.scheduleTimes || "";
  }

  // Calculate Shift Hours
  let hoursPerShift = 0;
  if (job.schedule?.startTime && job.schedule?.endTime) {
    const [startH, startM] = job.schedule.startTime.split(":").map(Number);
    const [endH, endM] = job.schedule.endTime.split(":").map(Number);
    hoursPerShift = (endH + endM / 60) - (startH + startM / 60);
    if (hoursPerShift < 0) hoursPerShift += 24;
  } else {
    hoursPerShift = job.scheduleHoursPerShift || 4;
  }

  // Budget calculations
  const rate = job.budgetPerHour || job.rate || 0;
  const shiftsCount = daysArray.length || job.budgetShifts || 1;
  const totalWeeklyHours = hoursPerShift * shiftsCount;
  const weeklyBudgetAmount = rate * totalWeeklyHours;

  const rateString = locale === "ar" ? `${rate}$/ساعة` : `$${rate}/hr`;
  const weeklyBudgetString = locale === "ar" ? `${weeklyBudgetAmount}$/أسبوع` : `$${weeklyBudgetAmount}/wk`;

  return (
    <div className="space-y-6">
      {/* Map & Location */}
      <div className="bg-white rounded-3xl border border-stitch-outline/10 shadow-soft overflow-hidden">
        <div className="w-full h-[180px]">
          <SharedMap center={mapCenter} readOnly={true} zoom={14} />
        </div>
        <div className="p-6 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-stitch-on-surface">{t("location")}</h3>
            <p className="text-xs font-semibold text-stitch-on-surface-variant/80 leading-relaxed">
              {locationAddress}
            </p>
          </div>
          {approxDistance && (
            <div className="text-[11px] font-extrabold text-[#005f56] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs leading-none">near_me</span>
              {t("approxDistance", { distance: approxDistance })}
            </div>
          )}
        </div>
      </div>

      {/* Service Schedule */}
      <div className="bg-white p-6 rounded-3xl border border-stitch-outline/10 shadow-soft space-y-4">
        <h3 className="text-sm font-extrabold text-stitch-on-surface">{t("serviceSchedule")}</h3>
        <div className="space-y-3">
          <div className="bg-gray-50/60 p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
            <span className="material-symbols-outlined text-stitch-primary text-xl">calendar_today</span>
            <div>
              <span className="block text-sm font-extrabold text-stitch-on-surface">
                {scheduleDays}
              </span>
              <span className="block text-[10px] font-semibold text-stitch-on-surface-variant/50 mt-0.5">
                {t("ongoingRecurring")}
              </span>
            </div>
          </div>

          <div className="bg-gray-50/60 p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
            <span className="material-symbols-outlined text-stitch-primary text-xl">schedule</span>
            <div>
              <span className="block text-sm font-extrabold text-stitch-on-surface">
                {scheduleTimes}
              </span>
              <span className="block text-[10px] font-semibold text-stitch-on-surface-variant/50 mt-0.5">
                {t("hoursPerShift", { count: Math.round(hoursPerShift) })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Family Budget */}
      <div className="bg-white p-6 rounded-3xl border border-stitch-outline/10 shadow-soft space-y-4">
        <h3 className="text-sm font-extrabold text-stitch-on-surface">{t("familyBudget")}</h3>
        <div className="space-y-3">
          <div className="bg-[#005f56]/5 border border-[#005f56]/10 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-stitch-primary text-xl">payments</span>
              <span className="text-xs font-bold text-stitch-on-surface-variant/80">{t("hourlyRate")}</span>
            </div>
            <span className="text-sm font-extrabold text-[#005f56]">{rateString}</span>
          </div>

          <div className="bg-[#005f56]/5 border border-[#005f56]/10 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-stitch-primary text-xl">wallet</span>
              <span className="text-xs font-bold text-stitch-on-surface-variant/80">{t("weeklyBudget")}</span>
            </div>
            <span className="text-sm font-extrabold text-[#005f56]">{weeklyBudgetString}</span>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-stitch-on-surface-variant/40 leading-normal text-center pt-1">
          {t("budgetFootnote", {
            hours: Math.round(totalWeeklyHours),
            shifts: shiftsCount,
            hoursPerShift: Math.round(hoursPerShift)
          })}
        </p>
      </div>

      {/* CareConnect Guarantee Badge */}
      <div className="bg-[#013530] text-white p-5 rounded-3xl flex items-start gap-3.5 shadow-md">
        <span className="material-symbols-outlined text-[#3ab09e] text-2xl mt-0.5">verified_user</span>
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold tracking-wide uppercase text-white">
            {t("guaranteedTitle")}
          </h4>
          <p className="text-[10px] font-medium text-white/70 leading-normal">
            {t("guaranteedDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
