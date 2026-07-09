import type { DashboardStats } from "@/components/dashboard/companion/StatsOverview";
import type { Booking } from "@/components/dashboard/companion/ScheduleOverview";

const TERMINAL_BOOKING_STATUSES = new Set(["cancelled", "declined", "rejected", "completed"]);

const getLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getSlotDateTime = (date: string, time: string): Date => {
  return new Date(`${date.slice(0, 10)}T${time || "00:00"}`);
};

export function mergeScheduleDerivedStats(
  stats: DashboardStats | null,
  schedule: Booking[],
  locale: string,
): DashboardStats | null {
  if (!stats) return null;

  const now = new Date();
  const today = getLocalDateString(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrow = getLocalDateString(tomorrowDate);

  const activeBookings = schedule.filter((booking) => {
    const normalizedStatus = booking.status?.toLowerCase();
    if (!normalizedStatus || TERMINAL_BOOKING_STATUSES.has(normalizedStatus)) return false;
    return booking.schedule?.some((slot) => getSlotDateTime(slot.date, slot.endTime) >= now);
  });

  const upcomingSlots = activeBookings
    .flatMap((booking) =>
      (booking.schedule || []).map((slot) => ({
        slot,
        startsAt: getSlotDateTime(slot.date, slot.startTime),
        dateKey: getLocalDateString(new Date(slot.date)),
      })),
    )
    .filter(({ startsAt }) => startsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const next48HourSlots = upcomingSlots.filter(({ dateKey }) => dateKey === today || dateKey === tomorrow);
  const nextSlot = upcomingSlots[0];
  const formatterLocale = locale === "ar" ? "ar-EG" : "en-US";

  return {
    ...stats,
    activeBookings: {
      count: activeBookings.length,
      statusLabel:
        activeBookings.length > 0
          ? locale === "ar"
            ? "نشط"
            : "Active"
          : locale === "ar"
            ? "غير نشط"
            : "Inactive",
    },
    upcomingVisits: {
      count: next48HourSlots.length,
      nextVisitLabel: nextSlot
        ? nextSlot.startsAt.toLocaleDateString(formatterLocale, {
            month: "short",
            day: "numeric",
            numberingSystem: "latn",
          })
        : "",
    },
  };
}
