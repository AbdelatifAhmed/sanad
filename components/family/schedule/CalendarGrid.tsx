"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

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

interface CalendarGridProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onChangeMonth: (date: Date) => void;
  allShifts: ScheduleItem[];
  locale: string;
  isRtl: boolean;
}

export default function CalendarGrid({
  selectedDate,
  onSelectDate,
  currentMonth,
  onChangeMonth,
  allShifts,
  locale,
  isRtl,
}: CalendarGridProps) {
  const t = useTranslations("familySchedule");

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    // Pad starting empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  // Generate weekday initials dynamically in local language
  const weekdayNames = useMemo(() => {
    const baseDate = new Date(2026, 0, 4); // Sunday
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: "narrow" });
    });
  }, [locale]);

  const monthName = useMemo(() => {
    return currentMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [currentMonth, locale]);

  // Check if a day has shifts
  const getShiftsForDay = (date: Date) => {
    const dateStr = date.toDateString();
    return allShifts.filter((shift) => new Date(shift.date).toDateString() === dateStr);
  };

  // Navigate months
  const prevMonth = () => {
    onChangeMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onChangeMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white border border-[#eae7e7] shadow-sm rounded-3xl p-5 md:p-6 space-y-6 h-fit">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1b1c1c]">{t("calendarTitle")}</h3>
        <div className="flex items-center space-x-1 space-x-reverse">
          <button 
            onClick={isRtl ? nextMonth : prevMonth} 
            className="p-1.5 hover:bg-[#f5f2eb] rounded-lg border border-[#eae7e7] transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-[#3e4949]" />
          </button>
          <span className="text-sm font-bold text-[#1b1c1c] min-w-[100px] text-center capitalize">
            {monthName}
          </span>
          <button 
            onClick={isRtl ? prevMonth : nextMonth} 
            className="p-1.5 hover:bg-[#f5f2eb] rounded-lg border border-[#eae7e7] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#3e4949]" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {/* Weekdays */}
        {weekdayNames.map((day, idx) => (
          <span key={idx} className="text-xs font-bold text-[#3e4949]/50 py-1 uppercase">
            {day}
          </span>
        ))}

        {/* Days */}
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square" />;

          const isSelected = selectedDate.toDateString() === day.toDateString();
          const isToday = new Date().toDateString() === day.toDateString();
          const shifts = getShiftsForDay(day);
          const hasShifts = shifts.length > 0;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all border cursor-pointer ${
                isSelected
                  ? "bg-[#1f8a8a] border-[#1f8a8a] text-white shadow-md font-bold scale-105"
                  : isToday
                  ? "bg-[#1f8a8a]/5 border-[#1f8a8a]/20 text-[#1f8a8a] font-bold"
                  : "bg-white border-transparent hover:bg-[#f5f2eb] hover:border-[#eae7e7] text-[#1b1c1c]"
              }`}
            >
              <span className="text-xs">{day.getDate()}</span>
              {hasShifts && (
                <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                  isSelected ? "bg-white" : "bg-[#1f8a8a] animate-pulse"
                }`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
