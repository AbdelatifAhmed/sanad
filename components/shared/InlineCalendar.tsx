"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";

interface InlineCalendarProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // Format: YYYY-MM-DD
}

const WEEKDAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKDAYS_AR = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export default function InlineCalendar({ value, onChange, minDate }: InlineCalendarProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const weekdays = isRtl ? WEEKDAYS_AR : WEEKDAYS_EN;

  // Parse initial selected date or default to today
  const selectedDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  // States for calendar navigation (month/year)
  const [navDate, setNavDate] = useState(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  });

  const navYear = navDate.getFullYear();
  const navMonth = navDate.getMonth();

  // Parse minDate if provided
  const parsedMinDate = useMemo(() => {
    if (!minDate) return null;
    const d = new Date(minDate);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minDate]);

  // Format month and year label
  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale, { month: "long" }).format(navDate);
  }, [navDate, locale]);

  const yearLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale, { year: "numeric" }).format(navDate);
  }, [navDate, locale]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    // Saturday = 0 in our week order.
    // getDay() returns: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
    // Map getDay() value to our Saturday-first index (0 to 6)
    // Sat (6) -> 0
    // Sun (0) -> 1
    // ...
    // Fri (5) -> 6
    const getSatFirstDayIndex = (d: Date) => {
      return (d.getDay() + 1) % 7;
    };

    const firstDayOfMonth = new Date(navYear, navMonth, 1);
    const startPadding = getSatFirstDayIndex(firstDayOfMonth);
    const totalDaysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(navYear, navMonth, 0).getDate();

    const daysList: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // 1. Padding days from the previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(navYear, navMonth - 1, prevMonthTotalDays - i);
      daysList.push({
        date: d,
        isCurrentMonth: false,
        key: `prev-${d.getTime()}`,
      });
    }

    // 2. Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(navYear, navMonth, i);
      daysList.push({
        date: d,
        isCurrentMonth: true,
        key: `curr-${d.getTime()}`,
      });
    }

    // 3. Padding days from the next month to make a perfect grid of 42 cells (6 rows * 7 columns)
    const totalCellsNeeded = 42;
    const remainingCells = totalCellsNeeded - daysList.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(navYear, navMonth + 1, i);
      daysList.push({
        date: d,
        isCurrentMonth: false,
        key: `next-${d.getTime()}`,
      });
    }

    return daysList;
  }, [navYear, navMonth]);

  const handlePrevMonth = () => {
    setNavDate(new Date(navYear, navMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(navYear, navMonth + 1, 1));
  };

  const handleDaySelect = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onChange(dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isDisabled = (date: Date) => {
    if (!parsedMinDate) return false;
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return compareDate.getTime() < parsedMinDate.getTime();
  };
  return (
    <div className="w-full bg-[#fcf9f6] border border-[#bdc9c8]/70 rounded-2xl p-3.5 shadow-sm ">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-extrabold text-[#1b1c1c] flex items-center gap-1 capitalize">
          <span className="text-[#1f8a8a]">{monthLabel}</span>
          <span className="text-gray-400 font-bold">{yearLabel}</span>
        </h4>
        <div className="flex gap-1" dir="ltr">
          <button
            type="button"
            onClick={isRtl ? handleNextMonth : handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#bdc9c8]/40 text-[#3e4949] hover:bg-[#1f8a8a]/5 hover:text-[#1f8a8a] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={isRtl ? handlePrevMonth : handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#bdc9c8]/40 text-[#3e4949] hover:bg-[#1f8a8a]/5 hover:text-[#1f8a8a] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1.5">
        {weekdays.map((day, idx) => (
          <span
            key={idx}
            className="text-[10px] font-bold text-[#3e4949]/50 uppercase tracking-wider py-0.5 select-none"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth, key }) => {
          const selected = isSelected(date);
          const disabled = isDisabled(date);
          const today = isToday(date);

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => handleDaySelect(date)}
              className={`aspect-square w-full rounded-lg flex flex-col items-center justify-center relative text-xs font-bold transition-all duration-200 cursor-pointer ${
                selected
                  ? "bg-[#1f8a8a] text-white shadow-md shadow-[#1f8a8a]/20 scale-105"
                  : disabled
                  ? "text-gray-300 cursor-not-allowed opacity-50"
                  : !isCurrentMonth
                  ? "text-gray-400/50 hover:bg-[#1f8a8a]/5 hover:text-[#1f8a8a]"
                  : "text-[#1b1c1c] hover:bg-[#1f8a8a]/10 hover:text-[#1f8a8a]"
              }`}
            >
              <span>{date.getDate()}</span>
              {/* Today indicator */}
              {today && (
                <span
                  className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    selected ? "bg-white" : "bg-[#1f8a8a]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
