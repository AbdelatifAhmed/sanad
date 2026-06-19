import React from "react";
import { useTranslations } from "next-intl";
import { Calendar, Clock, RefreshCw, AlertCircle } from "lucide-react";

interface ScheduleInformationProps {
  serviceDate: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  onChangeDate: (val: string) => void;
  onChangeStart: (val: string) => void;
  onChangeEnd: (val: string) => void;
  onToggleRecurring: () => void;
  errors?: Record<string, string>;
}

export default function ScheduleInformation({
  serviceDate,
  startTime,
  endTime,
  isRecurring,
  onChangeDate,
  onChangeStart,
  onChangeEnd,
  onToggleRecurring,
  errors = {},
}: ScheduleInformationProps) {
  const t = useTranslations("bookingForm");

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-sand-high/60">
        <Calendar className="w-5 h-5 text-[#005c53]" />
        <h3 className="font-display font-bold text-[#012d1d] text-lg">
          {t("scheduleInfo")}
        </h3>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Service Date */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {t("serviceDate")}
          </label>
          <div className="relative">
            <input 
              type="date"
              value={serviceDate}
              onChange={(e) => onChangeDate(e.target.value)}
              className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all pr-10 cursor-pointer ${
                errors.serviceDate ? "border-red-500 focus:border-red-500" : "border-sand-highest"
              }`}
            />
          </div>
          {errors.serviceDate && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.serviceDate}
            </p>
          )}
        </div>

        {/* Start Time */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {t("startTime")}
          </label>
          <div className="relative">
            <input 
              type="time"
              value={startTime}
              onChange={(e) => onChangeStart(e.target.value)}
              className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all pr-10 cursor-pointer ${
                errors.startTime ? "border-red-500 focus:border-red-500" : "border-sand-highest"
              }`}
            />
          </div>
          {errors.startTime && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.startTime}
            </p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {t("endTime")}
          </label>
          <div className="relative">
            <input 
              type="time"
              value={endTime}
              onChange={(e) => onChangeEnd(e.target.value)}
              className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all pr-10 cursor-pointer ${
                errors.endTime ? "border-red-500 focus:border-red-500" : "border-sand-highest"
              }`}
            />
          </div>
          {errors.endTime && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* Recurring Service Card */}
      <div className="flex items-center justify-between p-4 bg-[#fcf9f6] border border-sand-high rounded-2xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="bg-white p-2.5 rounded-xl border border-sand-high shadow-sm shrink-0">
            <RefreshCw className="w-5 h-5 text-[#005c53]" />
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

        {/* Switch Toggle */}
        <button
          type="button"
          onClick={onToggleRecurring}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer shrink-0 ${
            isRecurring ? "bg-[#005c53]" : "bg-gray-300"
          }`}
        >
          <div 
            className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-all duration-300 ${
              isRecurring ? "translate-x-6" : "translate-x-0"
            }`} 
          />
        </button>
      </div>
    </div>
  );
}

