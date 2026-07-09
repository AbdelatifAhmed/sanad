import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getAvatarUrl } from "@/lib/avatar";

export interface TaskItem {
  taskDescription: string;
  isCompleted: boolean;
  _id?: string;
}

export interface ScheduleSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  tasksList: TaskItem[];
}

export interface Booking {
  _id: string;
  familyId: {
    _id: string;
    name: string;
    phoneNumber?: string;
    phone?: string;
    email?: string;
    avatar?: any;
  } | null;
  status: string;
  startDate: string;
  endDate: string;
  schedule: ScheduleSlot[];
  jobPostId?: {
    _id: string;
    title: string;
    location?: {
      readableAddress?: string;
      city?: string;
      governorate?: string;
    } | null;
  } | null;
  hourlyRateAtBooking?: number;
  beneficiary?: {
    name: string;
    age?: number;
    gender?: string;
  } | null;
}

interface FlatScheduleItem {
  id: string;
  bookingId: string;
  family: {
    name: string;
    phoneNumber: string;
    email: string;
    avatar: any;
  };
  date: Date;
  startTime: string;
  endTime: string;
  tasks: TaskItem[];
  status: string;
  durationMin: number;
  visitTitle: string;
  beneficiaryName: string;
  hourlyRate: number;
}

interface ScheduleOverviewProps {
  schedule: Booking[];
  viewMode: "list" | "timeline";
}

// --- Helper Functions ---
const calculateDuration = (start: string, end: string): number => {
  try {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const totalStart = startH * 60 + startM;
    const totalEnd = endH * 60 + endM;
    return Math.max(0, totalEnd - totalStart);
  } catch {
    return 60; // fallback duration
  }
};

const getLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getRelativeDayLabel = (date: Date, t: any, locale: string): string => {
  const todayStr = getLocalDateString(new Date());
  const tomorrowStr = getLocalDateString(new Date(Date.now() + 86400000));
  const dateStr = getLocalDateString(date);

  if (dateStr === todayStr) return t("today");
  if (dateStr === tomorrowStr) return t("tomorrow");
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" });
};

const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getBgColorForName = (name: string): string => {
  const colors = [
    "bg-red-100 text-red-800",
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getBadgeStyles = (task: string): string => {
  const lower = task.toLowerCase();
  if (lower.includes("medication") || lower.includes("check")) {
    return "bg-[#aeedd5]/30 text-[#316d5b]";
  }
  if (lower.includes("post-op") || lower.includes("support") || lower.includes("therapy")) {
    return "bg-amber-100/50 text-amber-800";
  }
  return "bg-stitch-primary/10 text-stitch-primary";
};

export async function ScheduleOverview({ schedule, viewMode }: ScheduleOverviewProps) {
  const t = await getTranslations("companionDashboard");
  const locale = await getLocale();

  // Flatten and process the schedule slots
  const flattenSchedule = (bookings: Booking[]): FlatScheduleItem[] => {
    const flatItems: FlatScheduleItem[] = [];

    bookings.forEach((booking) => {
      if (!booking.schedule || !Array.isArray(booking.schedule)) return;
      const family = booking.familyId || {
        name: "Unknown Patient",
        phoneNumber: "",
        phone: "",
        email: "",
        avatar: null,
      };

      booking.schedule.forEach((slot) => {
        flatItems.push({
          id: slot._id || `${booking._id}-${slot.date}-${slot.startTime}`,
          bookingId: booking._id,
          family: {
            name: family.name,
            phoneNumber: family.phone || family.phoneNumber || "",
            email: family.email || "",
            avatar: family.avatar || null,
          },
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          tasks: slot.tasksList || [],
          status: booking.status,
          durationMin: calculateDuration(slot.startTime, slot.endTime),
          visitTitle: booking.jobPostId?.location?.readableAddress || booking.jobPostId?.title || (locale === "ar" ? "زيارة رعاية منزلية" : "Home Care Visit"),
          beneficiaryName: booking.beneficiary?.name || (locale === "ar" ? "المستفيد" : "Beneficiary"),
          hourlyRate: booking.hourlyRateAtBooking || 0,
        });
      });
    });

    // Sort chronologically by date and then by start time
    flatItems.sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    return flatItems;
  };

  const flatSchedule = flattenSchedule(schedule);

  // Group into today and tomorrow
  const todayObj = new Date();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(todayObj.getDate() + 1);

  const todayStr = getLocalDateString(todayObj);
  const tomorrowStr = getLocalDateString(tomorrowObj);

  const todayVisits = flatSchedule.filter((item) => getLocalDateString(item.date) === todayStr);
  const tomorrowVisits = flatSchedule.filter((item) => getLocalDateString(item.date) === tomorrowStr);
  const next48HoursVisits = flatSchedule.filter((item) => {
    const dateStr = getLocalDateString(item.date);
    return dateStr === todayStr || dateStr === tomorrowStr;
  });

  const nextVisitAfterTomorrow = flatSchedule.find((item) => getLocalDateString(item.date) > tomorrowStr);

  return (
    <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold text-stitch-on-surface">
          {t("scheduleTitle")}
        </h2>
        
        {/* Toggle links (Pure Server Component View Toggle) */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit shrink-0 text-xs font-semibold">
          <Link
            href="/companion/dashboard?view=list"
            className={`px-4 py-2 rounded-lg transition-colors font-bold ${
              viewMode === "list"
                ? "bg-white text-stitch-on-surface shadow-sm"
                : "text-stitch-on-surface-variant/60 hover:text-stitch-on-surface"
            }`}
          >
            {t("listView")}
          </Link>
          <Link
            href="/companion/dashboard?view=timeline"
            className={`px-4 py-2 rounded-lg transition-colors font-bold ${
              viewMode === "timeline"
                ? "bg-white text-stitch-on-surface shadow-sm"
                : "text-stitch-on-surface-variant/60 hover:text-stitch-on-surface"
            }`}
          >
            {t("timelineView")}
          </Link>
        </div>
      </div>

      {/* Appointments List / Timeline */}
      {viewMode === "list" ? (
        <div className="space-y-8">
          {/* Today Block */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant/50">
              {t("today")}, {todayObj.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", numberingSystem: "latn" })}
            </h3>
            
            {todayVisits.length === 0 ? (
              <div className="flex items-center justify-center p-6 border border-dashed border-stitch-outline/30 rounded-2xl bg-gray-50/40 text-sm text-stitch-on-surface-variant/60 font-medium">
                {t("noBookingsToday")}
              </div>
            ) : (
              <div className="space-y-4">
                {todayVisits.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-stitch-outline/15 rounded-2xl hover:bg-stitch-secondary-container/5 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-6">
                      {/* Time indicator */}
                      <div className="flex items-center gap-3 min-w-[80px]">
                        <div className="w-1.5 h-10 bg-stitch-primary rounded-full shrink-0"></div>
                        <div>
                          <p className="text-base font-bold text-stitch-on-surface">{item.startTime}</p>
                          <p className="text-[11px] text-stitch-on-surface-variant/50 font-medium">
                            {t("minutes", { count: item.durationMin })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Patient Info */}
                      <div className="flex items-center gap-3">
                        {getAvatarUrl(item.family.avatar) ? (
                          <img 
                            src={getAvatarUrl(item.family.avatar) || "/avatar_1.jpg"} 
                            alt={item.family.name}
                            className="w-10 h-10 rounded-full object-cover border border-stitch-outline/10 shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getBgColorForName(item.family.name)}`}>
                            {getInitials(item.family.name)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-stitch-on-surface">{item.family.name}</p>
                          {item.family.phoneNumber && (
                            <p className="text-xs text-stitch-on-surface-variant/60 flex items-center gap-0.5 mt-0.5">
                              <span className="material-symbols-outlined text-sm">phone</span>
                              {item.family.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:self-center flex flex-col items-end gap-1.5 font-stitch-body max-w-full sm:max-w-[40%]">
                      {/* Visit Title */}
                      <span className="text-xs font-extrabold text-[#012d1d] bg-stitch-primary/10 px-3 py-1.5 rounded-xl text-right inline-block break-words w-full">
                        {item.visitTitle}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 justify-end">
                        {/* Beneficiary Name */}
                        <span className="text-[11px] font-bold text-stitch-on-surface-variant/85 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-sm leading-none">person</span>
                          {item.beneficiaryName}
                        </span>
                        <span className="text-gray-300 text-xs">|</span>
                        {/* Session Earnings */}
                        <span className="text-[11px] font-extrabold text-[#316d5b] bg-[#aeedd5]/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <span>{locale === "ar" ? `${((item.durationMin / 60) * item.hourlyRate).toFixed(0)} ج.م` : `${((item.durationMin / 60) * item.hourlyRate).toFixed(0)} EGP`}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tomorrow Block */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant/50">
              {t("tomorrow")}, {tomorrowObj.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", numberingSystem: "latn" })}
            </h3>
            
            {tomorrowVisits.length === 0 ? (
              <div className="flex items-center justify-center p-6 border border-dashed border-stitch-outline/30 rounded-2xl bg-gray-50/40 text-sm text-stitch-on-surface-variant/60 font-medium">
                {nextVisitAfterTomorrow ? (
                  <span>
                    {t("noBookingsUntil", {
                      date: nextVisitAfterTomorrow.date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", numberingSystem: "latn" }),
                      time: nextVisitAfterTomorrow.startTime
                    })}
                  </span>
                ) : (
                  <span>{t("noBookingsTomorrow")}</span>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {tomorrowVisits.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-stitch-outline/15 rounded-2xl hover:bg-stitch-secondary-container/5 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-6">
                      {/* Time indicator */}
                      <div className="flex items-center gap-3 min-w-[80px]">
                        <div className="w-1.5 h-10 bg-stitch-primary rounded-full shrink-0"></div>
                        <div>
                          <p className="text-base font-bold text-stitch-on-surface">{item.startTime}</p>
                          <p className="text-[11px] text-stitch-on-surface-variant/50 font-medium">
                            {t("minutes", { count: item.durationMin })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Patient Info */}
                      <div className="flex items-center gap-3">
                        {getAvatarUrl(item.family.avatar) ? (
                          <img 
                            src={getAvatarUrl(item.family.avatar) || "/avatar_1.jpg"} 
                            alt={item.family.name}
                            className="w-10 h-10 rounded-full object-cover border border-stitch-outline/10 shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getBgColorForName(item.family.name)}`}>
                            {getInitials(item.family.name)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-stitch-on-surface">{item.family.name}</p>
                          {item.family.phoneNumber && (
                            <p className="text-xs text-stitch-on-surface-variant/60 flex items-center gap-0.5 mt-0.5">
                              <span className="material-symbols-outlined text-sm">phone</span>
                              {item.family.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:self-center flex flex-col items-end gap-1.5 font-stitch-body max-w-full sm:max-w-[40%]">
                      {/* Visit Title */}
                      <span className="text-xs font-extrabold text-[#012d1d] bg-stitch-primary/10 px-3 py-1.5 rounded-xl text-right inline-block break-words w-full">
                        {item.visitTitle}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 justify-end">
                        {/* Beneficiary Name */}
                        <span className="text-[11px] font-bold text-stitch-on-surface-variant/85 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-sm leading-none">person</span>
                          {item.beneficiaryName}
                        </span>
                        <span className="text-gray-300 text-xs">|</span>
                        {/* Session Earnings */}
                        <span className="text-[11px] font-extrabold text-[#316d5b] bg-[#aeedd5]/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <span>{locale === "ar" ? `${((item.durationMin / 60) * item.hourlyRate).toFixed(0)} ج.م` : `${((item.durationMin / 60) * item.hourlyRate).toFixed(0)} EGP`}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Timeline View */
        next48HoursVisits.length === 0 ? (
          <div className="flex items-center justify-center p-12 border border-dashed border-stitch-outline/30 rounded-2xl bg-gray-50/40 text-sm text-stitch-on-surface-variant/60 font-medium">
            {t("noBookingsScheduled")}
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto py-6 px-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className={`relative flex gap-12 items-start pb-6 pt-2 mx-auto ${next48HoursVisits.length < 4 ? "justify-center w-full" : "min-w-max"}`}>
              
              {/* Main horizontal track line */}
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-stitch-primary/10 via-stitch-primary/40 to-stitch-primary/10 top-[70px] z-0"></div>
              
              {next48HoursVisits.map((item, index) => {
                const isEven = index % 2 === 0;
                const verticalLineHeightClass = isEven ? "h-10" : "h-24";
                
                return (
                  <div key={item.id} className="relative flex flex-col items-center w-60 flex-shrink-0 group">
                    
                    {/* 1. Date & Time Label (Above the main horizontal line) */}
                    <div className="h-14 flex flex-col items-center justify-end pb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/40">
                        {getRelativeDayLabel(item.date, t, locale)}
                      </span>
                      <span className="text-xs font-extrabold text-stitch-primary mt-0.5">
                        {item.startTime}
                      </span>
                    </div>

                    {/* 2. Main Line Connector Node */}
                    <div className="relative flex items-center justify-center h-4 w-4 my-1 z-10 shrink-0">
                      {/* The small circle on the line */}
                      <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-stitch-primary shadow-sm flex items-center justify-center transition-all group-hover:scale-125 duration-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-stitch-primary"></div>
                      </div>
                    </div>

                    {/* 3. Hanging Vertical Connector Line */}
                    <div className={`w-0.5 bg-gradient-to-b from-stitch-primary to-stitch-primary/5 ${verticalLineHeightClass} shrink-0`}></div>

                    {/* 4. Circular Badge (with initials or avatar) */}
                    <div className="relative -mt-1 z-10 shrink-0">
                      {getAvatarUrl(item.family.avatar) ? (
                        <img 
                          src={getAvatarUrl(item.family.avatar) || "/avatar_1.jpg"} 
                          alt={item.family.name}
                          className="w-12 h-12 rounded-full object-cover border-4 border-white shadow-soft transition-transform group-hover:scale-110 duration-200"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-4 border-white shadow-soft transition-transform group-hover:scale-110 duration-200 ${getBgColorForName(item.family.name)}`}>
                          {getInitials(item.family.name)}
                        </div>
                      )}
                    </div>

                    {/* 5. Patient Card (Directly under the circle) */}
                    <div className="mt-3 bg-white p-4 rounded-2xl border border-stitch-outline/10 shadow-soft w-full hover:shadow-medium hover:border-stitch-outline/25 transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3">

                      {/* Body: Patient Name & Phone */}
                      <div className="text-center">
                        <p className="text-sm font-extrabold text-stitch-on-surface leading-tight truncate">
                          {item.family.name}
                        </p>
                        {item.family.phoneNumber && (
                          <p className="text-[11px] text-stitch-on-surface-variant/50 flex items-center justify-center gap-1 mt-1.5 font-medium">
                            <span className="material-symbols-outlined text-[13px] leading-none">phone</span>
                            {item.family.phoneNumber}
                          </p>
                        )}
                      </div>

                      {/* Divider / Session Info */}
                      <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-gray-100 font-stitch-body w-full">
                        {/* Visit Title */}
                        <span className="text-[11px] font-extrabold text-[#012d1d] bg-stitch-primary/10 px-2.5 py-1 rounded-lg text-center break-words w-full">
                          {item.visitTitle}
                        </span>
                        {/* Beneficiary Name */}
                        <span className="text-[10px] font-bold text-stitch-on-surface-variant/85 flex items-center gap-0.5 justify-center">
                          <span className="material-symbols-outlined text-[12px] leading-none">person</span>
                          {item.beneficiaryName}
                        </span>
                        {/* Session Earnings */}
                        <span className="text-[10px] font-extrabold text-[#316d5b] bg-[#aeedd5]/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 justify-center">
                          <span>{locale === "ar" ? `${((item.durationMin / 60) * item.hourlyRate).toFixed(0)} ج.م` : `${((item.durationMin / 60) * item.hourlyRate).toFixed(0)} EGP`}</span>
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
      {/* Next Appointment Outside 48h Info Banner */}
      {nextVisitAfterTomorrow && (
        <div className="mt-6 pt-4 border-t border-stitch-outline/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stitch-on-surface-variant/75 bg-stitch-secondary-container/5 p-4 rounded-2xl border border-dashed border-stitch-primary/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stitch-primary text-lg">
              event_upcoming
            </span>
            <span>
              {t("nextVisitAfter48h", {
                name: nextVisitAfterTomorrow.family.name,
                date: nextVisitAfterTomorrow.date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "long", month: "short", day: "numeric", numberingSystem: "latn" }),
                time: nextVisitAfterTomorrow.startTime
              })}
            </span>
          </div>
          <Link href="/companion/schedule" className="font-bold text-stitch-primary hover:underline shrink-0">
            {t("viewFullSchedule")}
          </Link>
        </div>
      )}

    </div>
  );
}
