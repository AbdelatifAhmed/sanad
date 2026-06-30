import Link from "next/link";
import { getTranslations } from "next-intl/server";

export interface DashboardStats {
  totalRequests: {
    count: number;
    growthPercentage: string;
  };
  activeBookings: {
    count: number;
    statusLabel: string;
  };
  upcomingVisits: {
    count: number;
    nextVisitLabel: string;
  };
  averageRating: {
    rating: number;
    stars: number;
  };
  profileCompletion: {
    percentage: number;
    message: string;
    missingFields: string[];
  };
}

interface StatsProps {
  stats: DashboardStats | null;
}

export async function StatsSection({ stats }: StatsProps) {
  const t = await getTranslations("companionDashboard");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Requests */}
      <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft flex flex-col justify-between h-[150px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-1.5 rounded-lg text-lg">
              assignment
            </span>
            <span className="text-[11px] font-bold tracking-wider text-stitch-on-surface-variant/50 uppercase">
              {t("totalRequests")}
            </span>
          </div>
          <p className="text-[10px] text-stitch-on-surface-variant/40 font-semibold leading-snug ps-9">
            {t("totalRequestsDesc")}
          </p>
        </div>
        <div className="flex items-baseline justify-between mt-auto">
          <span className="text-3xl font-bold text-stitch-on-surface">
            {stats?.totalRequests?.count ?? 0}
          </span>
          {stats?.totalRequests?.growthPercentage && (
            <span className="bg-[#aeedd5]/30 text-[#316d5b] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              {stats.totalRequests.growthPercentage}
            </span>
          )}
        </div>
      </div>

      {/* Active Bookings */}
      <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft flex flex-col justify-between h-[150px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-1.5 rounded-lg text-lg">
              verified
            </span>
            <span className="text-[11px] font-bold tracking-wider text-stitch-on-surface-variant/50 uppercase">
              {t("activeBookings")}
            </span>
          </div>
          <p className="text-[10px] text-stitch-on-surface-variant/40 font-semibold leading-snug ps-9">
            {t("activeBookingsDesc")}
          </p>
        </div>
        <div className="flex items-baseline justify-between mt-auto">
          <span className="text-3xl font-bold text-stitch-on-surface">
            {stats?.activeBookings?.count ?? 0}
          </span>
          {stats?.activeBookings?.statusLabel && (
            <span className="bg-[#aeedd5]/30 text-[#316d5b] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {stats.activeBookings.statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Upcoming Visits */}
      <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft flex flex-col justify-between h-[150px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-1.5 rounded-lg text-lg">
              medical_services
            </span>
            <span className="text-[11px] font-bold tracking-wider text-stitch-on-surface-variant/50 uppercase">
              {t("upcomingVisits")}
            </span>
          </div>
          <p className="text-[10px] text-stitch-on-surface-variant/40 font-semibold leading-snug ps-9">
            {t("upcomingVisitsDesc")}
          </p>
        </div>
        <div className="flex items-baseline justify-between mt-auto">
          <span className="text-3xl font-bold text-stitch-on-surface">
            {stats?.upcomingVisits?.count ?? 0}
          </span>
          {stats?.upcomingVisits?.nextVisitLabel && (
            <span className="text-xs font-semibold text-amber-600">
              {stats.upcomingVisits.nextVisitLabel}
            </span>
          )}
        </div>
      </div>

      {/* Average Rating */}
      <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft flex flex-col justify-between h-[150px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-1.5 rounded-lg text-lg">
              grade
            </span>
            <span className="text-[11px] font-bold tracking-wider text-stitch-on-surface-variant/50 uppercase">
              {t("averageRating")}
            </span>
          </div>
          <p className="text-[10px] text-stitch-on-surface-variant/40 font-semibold leading-snug ps-9">
            {t("averageRatingDesc")}
          </p>
        </div>
        <div className="flex items-baseline justify-between mt-auto">
          <span className="text-3xl font-bold text-stitch-on-surface">
            {stats?.averageRating?.rating ? stats.averageRating.rating.toFixed(1) : "5.0"}
          </span>
          <span className="text-[#316d5b] text-xs font-bold tracking-wider">
            {"★".repeat(stats?.averageRating?.stars ?? 5)}
            {"☆".repeat(5 - (stats?.averageRating?.stars ?? 5))}
          </span>
        </div>
      </div>
    </div>
  );
}

export async function ProfileCompletion({ stats }: StatsProps) {
  const t = await getTranslations("companionDashboard");
  const radius = 32;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const percentage = stats?.profileCompletion?.percentage ?? 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft flex flex-col items-center justify-between text-center min-h-[200px]">
      <h3 className="font-bold text-stitch-on-surface text-base w-full text-left">
        {t("profileCompletion")}
      </h3>
      
      <div className="flex items-center gap-6 my-4 w-full justify-center text-left">
        {/* SVG Circular Progress Bar */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-stitch-outline/25"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-stitch-primary"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-stitch-on-surface">
              {percentage}%
            </span>
          </div>
        </div>

        <div className="space-y-1 max-w-[170px]">
          <p className="text-xs text-stitch-on-surface-variant/75 leading-relaxed font-medium">
            {stats?.profileCompletion?.message || t("profileCompletionDefault")}
          </p>
          {percentage < 100 && (
            <Link href="/companion/profile" className="text-xs font-bold text-stitch-primary hover:underline block mt-1">
              {t("completeNow")}
            </Link>
          )}
        </div>
      </div>
      <div className="w-full font-bold"></div>
    </div>
  );
}
