"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompanionHobbiesProps {
  hobbies?: string[];
}

export default function CompanionHobbies({ hobbies }: CompanionHobbiesProps) {
  const t = useTranslations("companionProfile");

  if (!hobbies || hobbies.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
        <h3 className="font-display text-base font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-50" />
          {t("hobbies")}
        </h3>
        <p className="text-[11px] font-semibold text-gray-400 mt-2">
          {t("noHobbies")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
      <h3 className="font-display text-base font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
        <Heart className="w-5 h-5 text-rose-500 fill-rose-50" />
        {t("hobbies")}
      </h3>
      <div className="flex flex-wrap gap-2 pt-1">
        {hobbies.map((hobby, index) => (
          <span 
            key={index} 
            className="bg-[#fffcf9] text-gray-700 border border-amber-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-amber-50/30 cursor-default"
          >
            {hobby}
          </span>
        ))}
      </div>
    </div>
  );
}
