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
        <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft flex items-center justify-between gap-6 transition-all duration-300 hover:shadow-md">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-2 rounded-xl text-xl shrink-0">
                assignment
              </span>
              <span className="text-sm font-bold text-[#012d1d] truncate">
                {t("activeRequests")}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              {t("activeRequestsDesc")}
            </p>
          </div>
          <div className="text-5xl md:text-6xl font-black text-stitch-primary shrink-0 transition-transform duration-300 hover:scale-105 select-none">
            {activeRequestsCount}
          </div>
        </div>

        {/* Upcoming Visits Card */}
        <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft flex items-center justify-between gap-6 transition-all duration-300 hover:shadow-md">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-stitch-primary bg-stitch-primary/10 p-2 rounded-xl text-xl shrink-0">
                event
              </span>
              <span className="text-sm font-bold text-[#012d1d] truncate">
                {t("upcomingVisits")}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {t("upcomingVisitsDesc")}
              </p>
              {upcomingVisitsCount > 0 && (
                <span className="bg-[#aeedd5]/30 text-[#316d5b] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#316d5b] animate-pulse" />
                  {nextVisitLabel}
                </span>
              )}
            </div>
          </div>
          <div className="text-5xl md:text-6xl font-black text-stitch-primary shrink-0 transition-transform duration-300 hover:scale-105 select-none">
            {upcomingVisitsCount}
          </div>
        </div>
      </div>
    </div>
  );
}
