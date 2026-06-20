"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";

interface ScheduleInformationProps {
  serviceDate: string; // Service Date / Start Date
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  workingDays: string[];
  durationInWeeks: number;
  onChangeDate: (val: string) => void;
  onChangeStart: (val: string) => void;
  onChangeEnd: (val: string) => void;
  onToggleRecurring: () => void;
  onChangeWorkingDays: (val: string[]) => void;
  onChangeDuration: (val: number) => void;
  errors?: Record<string, string>;
}

const ALL_DAYS = [
  "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
];

const DAY_PRESETS = [
  { key: "daily", icon: "event_repeat", days: ALL_DAYS },
  { key: "weekdays", icon: "calendar_view_week", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  { key: "weekends", icon: "beach_access", days: ["Friday", "Saturday"] },
];

export default function ScheduleInformation({
  serviceDate,
  startTime,
  endTime,
  isRecurring,
  workingDays,
  durationInWeeks,
  onChangeDate,
  onChangeStart,
  onChangeEnd,
  onToggleRecurring,
  onChangeWorkingDays,
  onChangeDuration,
  errors = {},
}: ScheduleInformationProps) {
  const locale = useLocale();
  const t = useTranslations("bookingForm");
  const isAr = locale === "ar";

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      onChangeWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      onChangeWorkingDays([...workingDays, day]);
    }
  };

  const applyPreset = (presetDays: string[]) => {
    onChangeWorkingDays(presetDays);
  };

  const calculateHoursPerDay = () => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff / 60 : 0;
  };

  const hoursPerDay = calculateHoursPerDay();

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-sand-high/60">
        <Calendar className="w-5 h-5 text-[#1f8a8a]" />
        <h3 className="font-display font-bold text-[#012d1d] text-lg">
          {t("scheduleInfo")}
        </h3>
      </div>

      {/* 1. Basic Fields (Service Date, Start Time, End Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Service Date */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {isRecurring ? t("schedule.recurringStartDate") : t("schedule.startDate")} <span className="text-red-500">*</span>
          </label>
          <input 
            type="date"
            value={serviceDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all cursor-pointer ${
              errors.serviceDate ? "border-red-500 focus:border-red-500" : "border-[#bdc9c8]"
            }`}
          />
          {errors.serviceDate && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.serviceDate}
            </p>
          )}
        </div>

        {/* Start Time */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {t("startTime")} <span className="text-red-500">*</span>
          </label>
          <input 
            type="time"
            value={startTime}
            onChange={(e) => onChangeStart(e.target.value)}
            className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all cursor-pointer ${
              errors.startTime ? "border-red-500 focus:border-red-500" : "border-[#bdc9c8]"
            }`}
          />
          {errors.startTime && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.startTime}
            </p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {t("endTime")} <span className="text-red-500">*</span>
          </label>
          <input 
            type="time"
            value={endTime}
            onChange={(e) => onChangeEnd(e.target.value)}
            className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all cursor-pointer ${
              errors.endTime ? "border-red-500 focus:border-red-500" : "border-[#bdc9c8]"
            }`}
          />
          {errors.endTime && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* 2. Recurring Service Toggle Card */}
      <div className="flex items-center justify-between p-4 bg-[#fcf9f6] border border-sand-high rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="bg-white p-2.5 rounded-xl border border-sand-high shadow-sm shrink-0">
            <RefreshCw className="w-5 h-5 text-[#1f8a8a]" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-sm text-[#012d1d]">
              {t("recurringService")}
            </p>
            <p className="text-xs text-gray-400 font-semibold">
              {t("recurringDesc")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleRecurring}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer shrink-0 ${
            isRecurring ? "bg-[#1f8a8a]" : "bg-[#bdc9c8]"
          }`}
        >
          <div 
            className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-all duration-300 ${
              isRecurring ? (isAr ? "translate-x-0" : "translate-x-6") : (isAr ? "translate-x-6" : "translate-x-0")
            }`} 
          />
        </button>
      </div>

      {/* 3. Advanced Recurring Schedule (Visible only when isRecurring is true) */}
      {isRecurring && (
        <div className="pt-6 border-t border-[#bdc9c8]/30 space-y-6 animate-fade-in">
          {/* Working Days */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[#1f8a8a] mb-0.5">{t("schedule.workingDays")}</h4>
              <p className="text-xs text-gray-400 font-semibold">{t("schedule.workingDaysDesc")}</p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {DAY_PRESETS.map((preset) => {
                const isActive =
                  preset.days.length === workingDays.length &&
                  preset.days.every((d) => workingDays.includes(d));
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset.days)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-[#1f8a8a] bg-[#1f8a8a] text-white shadow-sm"
                        : "border-[#bdc9c8]/60 text-gray-600 hover:border-[#1f8a8a]/40 bg-gray-50/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs" style={{ fontSize: "14px" }}>
                      {preset.icon}
                    </span>
                    {t(`schedule.presets.${preset.key}` as any)}
                  </button>
                );
              })}
            </div>

            {/* Individual Days */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = workingDays.includes(day);
                const localName = t(`schedule.dayNames.${day}` as any);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex flex-col items-center py-3 rounded-2xl border-2 text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected
                        ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                        : "border-[#bdc9c8]/60 text-gray-500 hover:border-[#1f8a8a]/30 bg-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mb-1 transition-colors ${isSelected ? "bg-[#1f8a8a]" : "bg-gray-300"}`} />
                    {localName}
                  </button>
                );
              })}
            </div>
            {workingDays.length > 0 && (
              <p className="text-xs text-[#1f8a8a] font-bold">
                ✓ {workingDays.length} {workingDays.length > 1 ? t("schedule.daysSelected") : t("schedule.daySelected")} {workingDays.map(d => t(`schedule.dayNames.${d}` as any)).join(", ")}
              </p>
            )}
            {errors.workingDays && (
              <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.workingDays}
              </p>
            )}
          </div>

          <div className="border-t border-[#bdc9c8]/30" />

          {/* Duration */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[#1f8a8a] mb-0.5">{t("schedule.duration")}</h4>
              <p className="text-xs text-gray-400 font-semibold">{t("schedule.durationDesc")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-2">
                {([4, 8, 12, 24] as const).map((w) => {
                  const isActive = durationInWeeks === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onChangeDuration(w)}
                      className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center text-center hover:scale-[1.01] active:scale-[0.99] ${
                        isActive
                          ? "border-[#1f8a8a] bg-[#1f8a8a] text-white shadow-soft"
                          : "border-[#bdc9c8]/60 text-gray-600 hover:border-[#1f8a8a]/40 bg-[#fcf9f6]"
                      }`}
                    >
                      {t(`schedule.months.${w}` as any)}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input Card */}
              <div className="bg-[#fcf9f6] p-4 rounded-2xl border border-[#bdc9c8]/40 flex flex-col justify-between space-y-2">
                <label className="text-xs font-bold text-gray-500" htmlFor="custom_weeks_input">
                  {t("schedule.orSpecifyCustom")}
                </label>
                <div className="relative flex items-center w-full">
                  <input
                    id="custom_weeks_input"
                    type="number"
                    min={1}
                    value={durationInWeeks || ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      onChangeDuration(val);
                    }}
                    placeholder={t("schedule.customWeeks")}
                    className={`w-full bg-white border rounded-xl pl-4 pr-16 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all ${
                      errors.durationInWeeks ? "border-red-500 focus:border-red-500" : "border-[#bdc9c8]"
                    }`}
                  />
                  <span className={`absolute ${isAr ? "left-4" : "right-4"} text-xs font-bold text-gray-400 pointer-events-none`}>
                    {t("schedule.weeks")}
                  </span>
                </div>
              </div>
            </div>
            
            {errors.durationInWeeks && (
              <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.durationInWeeks}
              </p>
            )}
          </div>

          <div className="border-t border-[#bdc9c8]/30" />

          {/* Redesigned 3-Column Scheduling Summary Stats Panel */}
          <div className="bg-[#fcf9f6] border border-sand-high rounded-2xl p-5 shadow-sm grid grid-cols-3 gap-4 text-center">
            {/* Daily Hours Stat */}
            <div className="space-y-1 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {t("schedule.hoursPerDay")}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#012d1d]">
                {hoursPerDay > 0 ? `${hoursPerDay} ${t("schedule.hours")}` : "—"}
              </span>
            </div>
            
            {/* Weekly Hours Stat */}
            <div className="space-y-1 flex flex-col justify-center border-l border-sand-high">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {t("schedule.weeklyHours")}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#1f8a8a]">
                {hoursPerDay > 0 && workingDays.length > 0 
                  ? `${(hoursPerDay * workingDays.length).toFixed(1)} ${t("schedule.hours")}` 
                  : "—"}
              </span>
            </div>

            {/* Total Duration Stat */}
            <div className="space-y-1 flex flex-col justify-center border-l border-sand-high">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {t("schedule.totalDuration")}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#7d562d]">
                {[4, 8, 12, 24].includes(durationInWeeks)
                  ? t(`schedule.months.${durationInWeeks}` as any)
                  : durationInWeeks && durationInWeeks > 0 
                    ? `${durationInWeeks} ${t("schedule.weeks")}` 
                    : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
