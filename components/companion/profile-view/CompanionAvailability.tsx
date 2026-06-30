"use client";

import React from "react";
import { Calendar, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface AvailabilitySlot {
  day: string;
  slots: string[];
}

interface CompanionAvailabilityProps {
  availability?: AvailabilitySlot[];
}

export default function CompanionAvailability({ availability }: CompanionAvailabilityProps) {
  const t = useTranslations("companionProfile");

  if (!availability || availability.length === 0) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
        <h3 className="font-display text-lg font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
          <Calendar className="w-5 h-5 text-[#005c53]" />
          {t("availability")}
        </h3>
        <p className="text-xs font-semibold text-gray-400">
          {t("noAvailability")}
        </p>
      </div>
    );
  }

  // Order of days for rendering
  const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Sort availability by day order
  const sortedAvailability = [...availability].sort((a, b) => {
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
  });

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-6">
      <h3 className="font-display text-lg font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
        <Calendar className="w-5 h-5 text-[#005c53]" />
        {t("availability")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedAvailability.map((item, index) => (
          <div 
            key={index} 
            className="bg-[#fcf9f6] border border-sand-high/80 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-2 text-[#012d1d] font-bold text-xs uppercase tracking-wider border-b border-sand-high/40 pb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005c53]" />
              {t(item.day as any)}
            </div>
            <div className="flex flex-col gap-1.5">
              {item.slots && item.slots.length > 0 ? (
                item.slots.map((slot, slotIdx) => (
                  <span 
                    key={slotIdx}
                    className="bg-white border border-sand-high text-gray-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 justify-center shadow-sm"
                  >
                    <Clock className="w-3 h-3 text-[#005c53]" />
                    {slot}
                  </span>
                ))
              ) : (
                <span className="text-[10px] font-semibold text-gray-400 italic text-center py-1">
                  {t("noSlots")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
