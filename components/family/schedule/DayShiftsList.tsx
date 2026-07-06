"use client";

import React from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowRight 
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getAvatarUrl } from "@/lib/avatar";

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

interface DayShiftsListProps {
  selectedDate: Date;
  shifts: ScheduleItem[];
  locale: string;
  isRtl: boolean;
}

export default function DayShiftsList({
  selectedDate,
  shifts,
  locale,
  isRtl,
}: DayShiftsListProps) {
  const t = useTranslations("familySchedule");

  const getShiftStatus = (shift: ScheduleItem) => {
    if (shift.checkOutTime) return "completed";
    if (shift.checkInTime) return "active";
    
    // Check if scheduled date/time has passed
    const now = new Date();
    const shiftDate = new Date(shift.date);
    const [hours, minutes] = shift.startTime.split(":").map(Number);
    shiftDate.setHours(hours, minutes, 0, 0);
    
    if (now > shiftDate) return "late";
    return "awaiting";
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-emerald-50 border border-emerald-100",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
          label: t("statusCompleted")
        };
      case "active":
        return {
          bg: "bg-teal-50 border border-teal-100 animate-pulse",
          text: "text-stitch-primary",
          dot: "bg-stitch-primary",
          label: t("statusActive")
        };
      case "late":
        return {
          bg: "bg-red-50 border border-red-100",
          text: "text-red-650",
          dot: "bg-red-500",
          label: t("statusLate")
        };
      default:
        return {
          bg: "bg-amber-50 border border-amber-100",
          text: "text-amber-700",
          dot: "bg-amber-500",
          label: t("statusAwaiting")
        };
    }
  };

  return (
    <div className="bg-white border border-[#eae7e7] shadow-sm rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#eae7e7] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[#1b1c1c]">{t("selectedDayShifts")}</h3>
          <p className="text-xs text-[#3e4949]/70 mt-1 capitalize">
            {selectedDate.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span className="text-xs bg-[#1f8a8a]/10 text-[#1f8a8a] border border-[#1f8a8a]/20 px-3 py-1 rounded-full font-bold">
          {t("shiftsCount", { count: shifts.length })}
        </span>
      </div>

      {shifts.length > 0 ? (
        <div className="space-y-4">
          {shifts.map((shift, idx) => {
            const status = getShiftStatus(shift);
            const statusInfo = getStatusStyles(status);
            const checkInTimeStr = shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : null;
            const checkOutTimeStr = shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : null;
            
            // Safe evaluation of avatar using shared getAvatarUrl helper
            const companionAvatar = getAvatarUrl(shift.companionId.avatar);

            return (
              <div key={idx} className="p-5 bg-[#fbfaf7] border border-[#eae7e7] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-soft transition-all">
                <div className="flex items-start gap-4">
                  {/* Caregiver Avatar */}
                  {companionAvatar ? (
                    <img src={companionAvatar} alt={shift.companionId.name} className="w-12 h-12 rounded-full object-cover border border-[#eae7e7]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#1f8a8a]/10 text-[#1f8a8a] flex items-center justify-center font-black border border-[#1f8a8a]/20 text-lg shrink-0">
                      {shift.companionId.name.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-[#1b1c1c] text-base">{shift.companionId.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#eae7e7] text-[#3e4949] font-mono">
                        {t("shiftIndex", { index: shift.slotIndex + 1 })}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                        <span className={`w-1 h-1 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#3e4949]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#1f8a8a]" />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </span>
                      {shift.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#1f8a8a]" />
                          <span className="truncate max-w-[200px]">{shift.location.readableAddress || shift.location.city}</span>
                        </span>
                      )}
                    </div>

                    {/* Clock logs */}
                    {(checkInTimeStr || checkOutTimeStr) && (
                      <div className="text-[10px] text-[#3e4949]/70 pt-1 flex gap-3 flex-wrap">
                        {checkInTimeStr && <span>{t("checkedInAt", { time: checkInTimeStr })}</span>}
                        {checkOutTimeStr && <span>{t("checkedOutAt", { time: checkOutTimeStr })}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {shift.companionId.phone && (
                    <a
                      href={`tel:${shift.companionId.phone}`}
                      className="p-2 border border-[#eae7e7] hover:bg-[#eae7e7]/30 rounded-xl transition-all"
                      title={shift.companionId.phone}
                    >
                      <Phone className="w-4 h-4 text-[#3e4949]" />
                    </a>
                  )}
                  <Link
                    href={`/family/bookings/${shift.bookingId}?from=schedule`}
                    className="px-4 py-2 bg-[#1f8a8a] hover:bg-[#0d8282] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm border border-[#1f8a8a]/10 cursor-pointer"
                  >
                    <span>{t("viewVisit")}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-[#3e4949]/60 text-sm bg-[#fbfaf7]/50 border border-dashed border-[#eae7e7] rounded-2xl space-y-2">
          <CalendarIcon className="w-12 h-12 mx-auto text-[#eae7e7]" />
          <p>{t("noShiftsToday")}</p>
          <p className="text-xs text-[#3e4949]/50">{t("noShiftsTodayDesc")}</p>
        </div>
      )}
    </div>
  );
}
