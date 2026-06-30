import React from "react";
import { getTranslations } from "next-intl/server";

interface OverviewSectionProps {
  activeRequestsCount: number;
  upcomingVisitsCount: number;
  nextVisitLabel: string;
}

export default async function OverviewSection({
  activeRequestsCount,
  upcomingVisitsCount,
  nextVisitLabel,
}: OverviewSectionProps) {
  const t = await getTranslations("familyDashboard");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-[#012d1d]">
        {t("overviewTitle")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Active Requests Card */}
        <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft flex flex-col justify-between h-[150px]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-1.5 rounded-lg text-lg">
                assignment
              </span>
              <span className="text-[11px] font-bold tracking-wider text-stitch-on-surface-variant/50 uppercase">
                {t("activeRequests")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-3xl font-bold text-stitch-on-surface">
              {activeRequestsCount}
            </span>
            <span className="text-xs text-stitch-on-surface-variant/50 font-medium">
              {t("activeRequestsDesc")}
            </span>
          </div>
        </div>

        {/* Upcoming Visits Card */}
        <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft flex flex-col justify-between h-[150px]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-1.5 rounded-lg text-lg">
                event
              </span>
              <span className="text-[11px] font-bold tracking-wider text-stitch-on-surface-variant/50 uppercase">
                {t("upcomingVisits")}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-auto w-full">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-stitch-on-surface">
                {upcomingVisitsCount}
              </span>
              <span className="text-xs text-stitch-on-surface-variant/50 font-medium">
                {t("upcomingVisitsDesc")}
              </span>
            </div>
            {upcomingVisitsCount > 0 && (
              <span className="bg-[#aeedd5]/30 text-[#316d5b] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#316d5b] animate-pulse" />
                {nextVisitLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
