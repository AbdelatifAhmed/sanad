"use client";

import { useState, useRef, useEffect } from "react";

interface DateRangePickerProps {
  label: string;
  defaultStartDate: string;
  defaultEndDate: string;
  locale: string;
  anytimeLabel: string;
}

export default function DateRangePicker({
  label,
  defaultStartDate,
  defaultEndDate,
  locale,
  anytimeLabel,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar navigation state
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // Close popup on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update states when default props change
  useEffect(() => {
    setStartDate(defaultStartDate);
  }, [defaultStartDate]);

  useEffect(() => {
    setEndDate(defaultEndDate);
  }, [defaultEndDate]);

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthNamesAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const daysOfWeekEn = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const daysOfWeekAr = ["أح", "ن", "ث", "ر", "خ", "ج", "س"];

  const monthNames = locale === "ar" ? monthNamesAr : monthNamesEn;
  const daysOfWeek = locale === "ar" ? daysOfWeekAr : daysOfWeekEn;

  // Month navigation helpers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Date selection helper
  const handleDayClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const clickedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDateStr);
      setEndDate("");
    } else {
      const start = new Date(startDate);
      const clicked = new Date(clickedDateStr);

      if (clicked < start) {
        setStartDate(clickedDateStr);
        setEndDate("");
      } else {
        setEndDate(clickedDateStr);
        // Automatically close popover after selecting the range
        setTimeout(() => setIsOpen(false), 300);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartDate("");
    setEndDate("");
  };

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays: Array<number | null> = [];
  // Pad the start of the grid with nulls for empty slots
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Format date for display in the input card
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = monthNames[d.getMonth()];
    return `${day} ${month}`;
  };

  let displayValue = anytimeLabel;
  if (startDate && endDate) {
    displayValue = `${formatDateString(startDate)} - ${formatDateString(endDate)}`;
  } else if (startDate) {
    displayValue = locale === "ar" ? `من ${formatDateString(startDate)}` : `From ${formatDateString(startDate)}`;
  }

  const isSelected = (day: number) => {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dStr === startDate || dStr === endDate;
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(dStr);
    return d > new Date(startDate) && d < new Date(endDate);
  };

  return (
    <div
      ref={containerRef}
      className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center gap-2 relative cursor-pointer select-none min-h-[72px] hover:border-stitch-outline/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-200"
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="material-symbols-outlined text-[#005f56] text-xl shrink-0">calendar_today</span>
      <div className="flex-1 min-w-0">
        <span className="block text-[9px] font-bold text-stitch-on-surface-variant/40 tracking-wider uppercase">
          {label}
        </span>
        <span className="block text-xs font-extrabold text-stitch-on-surface truncate mt-0.5">
          {displayValue}
        </span>
      </div>
      <span
        className={`material-symbols-outlined text-stitch-on-surface-variant/40 transition-transform shrink-0 ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        expand_more
      </span>

      {/* Hidden native inputs for form submission */}
      <input type="hidden" name="startDate" value={startDate} />
      <input type="hidden" name="endDate" value={endDate} />

      {/* Popover Calendar */}
      {isOpen && (
        <div
          className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-50 p-4 w-[310px] animate-fade-in cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-sm text-[#005f56] rtl:rotate-180">arrow_back_ios</span>
            </button>
            <span className="font-bold text-xs text-stitch-on-surface">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-sm text-[#005f56] rtl:rotate-180">arrow_forward_ios</span>
            </button>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map((day, idx) => (
              <span key={idx} className="text-[10px] font-bold text-stitch-on-surface-variant/40 uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Monthly Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const selected = isSelected(day);
              const inRange = isInRange(day);

              return (
                <div
                  key={`day-${day}`}
                  onClick={(e) => handleDayClick(day, e)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors relative ${
                    selected
                      ? "bg-[#005f56] text-white rounded-full z-10"
                      : inRange
                      ? "bg-[#005f56]/15 text-[#005f56] rounded-none hover:bg-[#005f56]/20"
                      : "hover:bg-gray-100 text-stitch-on-surface rounded-full"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-transparent border-none cursor-pointer hover:underline"
            >
              {locale === "ar" ? "مسح الاختيار" : "Clear"}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-[#005f56] hover:bg-[#004e46] text-white font-extrabold text-[10px] py-1.5 px-4 rounded-lg transition-colors cursor-pointer border-none"
            >
              {locale === "ar" ? "تطبيق" : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
