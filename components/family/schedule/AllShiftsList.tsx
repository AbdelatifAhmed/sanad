"use client";

import React from "react";
import { Clock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface ScheduleItem {
  bookingId: string;
  bookingStatus: string;
  companionId: {
    _id: string;
    name: string;
    avatar?: any;
    phone?: string;
  };
  location: any;
  date: string;
  startTime: string;
  endTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  tasksList: any[];
  slotIndex: number;
}

interface AllShiftsListProps {
  shifts: ScheduleItem[];
  filterType: "upcoming" | "past";
  locale: string;
}

export default function AllShiftsList({
  shifts,
  filterType,
  locale,
}: AllShiftsListProps) {
  const t = useTranslations("familySchedule");

  return (
    <div className="bg-white border border-[#eae7e7] shadow-sm rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#eae7e7] pb-4">
        <h3 className="text-lg font-bold text-[#1b1c1c]">
          {filterType === "upcoming" ? t("upcomingShifts") : t("pastShifts")}
        </h3>
        <span className="text-xs bg-[#fbfaf7] border border-[#eae7e7] text-[#3e4949] px-2.5 py-1 rounded-lg font-mono">
          {t("totalShifts", { count: shifts.length })}
        </span>
      </div>

      {shifts.length > 0 ? (
        <div className="divide-y divide-[#eae7e7]">
          {shifts.map((shift, idx) => {
            const dateObj = new Date(shift.date);
            const dateStr = dateObj.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
            
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#1b1c1c] text-sm">{shift.companionId.name}</h4>
                    <span className="text-[10px] bg-[#fbfaf7] border border-[#eae7e7] text-[#3e4949] px-2 py-0.5 rounded font-bold">
                      {dateStr}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#3e4949]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1f8a8a]" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </span>
                    {shift.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1f8a8a]" />
                        <span className="truncate max-w-[150px]">{shift.location.readableAddress || shift.location.city}</span>
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/family/bookings/${shift.bookingId}`}
                  className="px-3.5 py-1.5 bg-[#f5f2eb] hover:bg-[#eae7e7]/50 text-[#3e4949] font-semibold rounded-xl text-xs transition-all border border-[#eae7e7] cursor-pointer"
                >
                  {t("details")}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-[#3e4949]/50 text-sm">
          {t("noShiftsMatched")}
        </div>
      )}
    </div>
  );
}
