"use client";

import { useState } from "react";
import { CareRequestFormData, WorkingDay } from "@/lib/types/care-request";
import { useLocale, useTranslations } from "next-intl";
import InlineCalendar from "@/components/shared/InlineCalendar";

type Step2Data = Pick<CareRequestFormData, "scheduleData">;

interface StepSchedulingProps {
  defaultValues: Step2Data;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

const ALL_DAYS: WorkingDay[] = [
  "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
];

const DAY_PRESETS: { value: "daily" | "weekdays" | "weekends"; icon: string; days: WorkingDay[] }[] = [
  { value: "daily", icon: "event_repeat", days: ALL_DAYS },
  { value: "weekdays", icon: "calendar_view_week", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  { value: "weekends", icon: "beach_access", days: ["Friday", "Saturday"] },
];

export default function StepScheduling({ defaultValues, onNext, onBack }: StepSchedulingProps) {
  const t = useTranslations("jobPostForm");
  const tBooking = useTranslations("bookingForm");
  const locale = useLocale();
  const isRtl = locale === "ar";
  
  const s = defaultValues.scheduleData;

  const [workingDays, setWorkingDays] = useState<WorkingDay[]>(s.workingDays);
  const [startTime, setStartTime] = useState(s.startTime);
  const [endTime, setEndTime] = useState(s.endTime);
  const [durationInWeeks, setDurationInWeeks] = useState<number | "">(s.durationInWeeks);
  const [startDate, setStartDate] = useState<string>(
    s.startDate || new Date().toISOString().split("T")[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleDay = (day: WorkingDay) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setErrors((er) => ({ ...er, workingDays: "" }));
  };

  const applyPreset = (days: WorkingDay[]) => {
    setWorkingDays(days);
    setErrors((er) => ({ ...er, workingDays: "" }));
  };

  const calcHours = () => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) {
      diff += 24 * 60; // Spans across midnight to next day
    }
    return diff / 60;
  };

  const totalHoursPerDay = calcHours();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!startDate) errs.startDate = tBooking("validation.dateRequired" as any);
    if (workingDays.length === 0) errs.workingDays = tBooking("validation.workingDaysRequired" as any);
    if (!startTime) errs.startTime = tBooking("validation.startRequired" as any);
    if (!endTime) errs.endTime = tBooking("validation.endRequired" as any);
    if (startTime && endTime && startTime === endTime)
      errs.endTime = tBooking("validation.endTimeAfterStart" as any);
    if (durationInWeeks === "" || Number(durationInWeeks) < 1)
      errs.durationInWeeks = tBooking("validation.durationRequired" as any);
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext({
      scheduleData: {
        workingDays,
        startTime,
        endTime,
        durationInWeeks: Number(durationInWeeks),
        startDate,
      },
    });
  };

  const getDurationLabel = (w: number) => {
    if (w === 52) return t("year");
    if (w === 4) return t("month");
    if (w === 8) return t("months", { count: 2 });
    if (w === 12) return t("months", { count: 3 });
    if (w === 24) return t("months", { count: 6 });
    return t("customWeeks", { count: w });
  };

  return (
    <div className="space-y-8">
      {/* Working days */}
      <div>
        <h3 className="text-xl font-bold text-[#1f8a8a] mb-1">{t("workingDays")}</h3>
        <p className="text-sm text-[#3e4949]">{t("workingDaysDesc")}</p>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        {DAY_PRESETS.map((preset) => {
          const isActive =
            preset.days.length === workingDays.length &&
            preset.days.every((d) => workingDays.includes(d));
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "border-[#1f8a8a] bg-[#1f8a8a] text-white"
                  : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
              }`}
            >
              <span className="material-symbols-outlined text-base">{preset.icon}</span>
              {tBooking(`schedule.presets.${preset.value}` as any)}
            </button>
          );
        })}
      </div>

      {/* Day toggles */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {ALL_DAYS.map((day) => {
          const isSelected = workingDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                  : "border-[#bdc9c8]/60 text-[#3e4949]/60 hover:border-[#1f8a8a]/40"
              }`}
            >
              <span className={`w-2 h-2 rounded-full mb-1 ${isSelected ? "bg-[#1f8a8a]" : "bg-[#bdc9c8]"}`} />
              {tBooking(`schedule.dayNames.${day}` as any)}
            </button>
          );
        })}
      </div>
      {workingDays.length > 0 && (
        <p className="text-xs text-[#1f8a8a] font-medium">
          ✓ {workingDays.length} {workingDays.length > 1 ? tBooking("schedule.daysSelected" as any) : tBooking("schedule.daySelected" as any)} {workingDays.map(d => tBooking(`schedule.dayNames.${d}` as any)).join(", ")}
        </p>
      )}
      {errors.workingDays && <p className="text-xs text-red-500">{errors.workingDays}</p>}

      <div className="border-t border-[#bdc9c8]/30" />

      {/* Working hours */}
      <div>
        <h3 className="text-xl font-bold text-[#1f8a8a] mb-1">{t("workingHours")}</h3>
        <p className="text-sm text-[#3e4949]">{t("workingHoursDesc")}</p>
      </div>


      {/* Start Date Inline Calendar (In its own row/full width with responsive padding) */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]">
          {tBooking("schedule.recurringStartDate")} <span className="text-red-500">*</span>
        </label>
        <div className="w-full md:px-16 lg:px-28">
          <InlineCalendar
            value={startDate}
            minDate={new Date().toISOString().split("T")[0]}
            onChange={(date) => {
              setStartDate(date);
              setErrors((er) => ({ ...er, startDate: "" }));
            }}
          />
        </div>
        {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
      </div>

      {/* Time pickers + Summary stacked tightly in their own row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
        {/* Time range selection */}
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-[#1b1c1c]">
            {t("workingHours")} <span className="text-red-500">*</span>
          </span>
          <div className="flex gap-3 items-center">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-[#3e4949]/70 uppercase tracking-wider font-semibold">{t("startTime")}</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setErrors((er) => ({ ...er, startTime: "" })); }}
                className="w-full h-12 rounded-xl border border-[#bdc9c8] bg-white px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-center"
              />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
            </div>
            <span className="text-[#3e4949] pt-5 text-sm font-bold">{t("to")}</span>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-[#3e4949]/70 uppercase tracking-wider font-semibold">{t("endTime")}</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setErrors((er) => ({ ...er, endTime: "" })); }}
                className="w-full h-12 rounded-xl border border-[#bdc9c8] bg-white px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-center"
              />
              {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
            </div>
          </div>
        </div>

        {/* Hours summary card */}
        <div className="bg-[#f6f3f2] p-4 rounded-2xl flex items-center gap-3 border border-[#bdc9c8]/20 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#bdc9c8]/30 shrink-0">
            <span className="material-symbols-outlined text-[#1f8a8a]">schedule</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1b1c1c]">
              {totalHoursPerDay ? t("hoursPerDay", { count: totalHoursPerDay }) : t("setHours")}
            </p>
            <p className="text-xs text-[#3e4949] mt-0.5">
              {totalHoursPerDay && workingDays.length > 0
                ? t("hoursPerWeek", { count: (totalHoursPerDay * workingDays.length).toFixed(0) })
                : t("selectDaysTimes")}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#bdc9c8]/30" />

      {/* Duration */}
      <div>
        <h3 className="text-xl font-bold text-[#1f8a8a] mb-1">{t("duration")}</h3>
        <p className="text-sm text-[#3e4949]">{t("durationDesc")}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="duration_weeks">
          {t("duration")} ({t("weeks")}) <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {[4, 8, 12, 24, 52].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => { setDurationInWeeks(w); setErrors((er) => ({ ...er, durationInWeeks: "" })); }}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                durationInWeeks === w
                  ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                  : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
              }`}
            >
              {getDurationLabel(w)}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className={`material-symbols-outlined absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-[#3e4949] pointer-events-none`}>
            timelapse
          </span>
          <input
            id="duration_weeks"
            type="number"
            min={1}
            value={durationInWeeks}
            onChange={(e) => {
              setDurationInWeeks(e.target.value === "" ? "" : Number(e.target.value));
              setErrors((er) => ({ ...er, durationInWeeks: "" }));
            }}
            placeholder={t("durationPlaceholder")}
            className={`w-full h-14 bg-white border border-[#bdc9c8] rounded-xl ${isRtl ? "pr-12 pl-4" : "pl-12 pr-4"} text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all`}
          />
        </div>
        {errors.durationInWeeks && <p className="text-xs text-red-500">{errors.durationInWeeks}</p>}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-[#bdc9c8]/30">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 h-14 rounded-xl text-[#1f8a8a] font-bold text-sm hover:bg-[#1f8a8a]/5 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          {t("back")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-8 h-14 rounded-xl bg-[#1f8a8a] text-white font-bold text-sm hover:bg-[#0d8282] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {t("next")}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
