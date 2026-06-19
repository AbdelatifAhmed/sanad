import React from "react";
import { ClipboardList, Calendar } from "lucide-react";

interface OverviewSectionProps {
  activeRequestsCount: number;
  upcomingVisitsCount: number;
  nextVisitLabel: string;
}

export default function OverviewSection({
  activeRequestsCount,
  upcomingVisitsCount,
  nextVisitLabel
}: OverviewSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-[#012d1d]">
        Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Active Requests Card */}
        <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft flex flex-col justify-between min-h-[150px] transition-all duration-300 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-[#e6f4f2] text-[#015347] flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold text-[#1c1c1a] block font-body">
              {activeRequestsCount}
            </span>
            <span className="text-xs font-semibold text-gray-500 mt-1 block tracking-wide">
              Active Requests
            </span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
              Total ongoing contracts & pending requests
            </span>
          </div>
        </div>

        {/* Upcoming Visits Card */}
        <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft flex flex-col justify-between min-h-[150px] transition-all duration-300 hover:shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            {upcomingVisitsCount > 0 && (
              <span className="bg-[#e8f5e9] text-[#2e7d32] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 border border-[#c8e6c9]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32] animate-pulse" />
                {nextVisitLabel}
              </span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold text-[#1c1c1a] block font-body">
              {upcomingVisitsCount}
            </span>
            <span className="text-xs font-semibold text-gray-500 mt-1 block tracking-wide">
              Upcoming Visits
            </span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
              Individual scheduled sessions/shifts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
