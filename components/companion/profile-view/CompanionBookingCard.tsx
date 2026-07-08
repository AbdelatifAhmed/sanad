"use client";

import React from "react";
import Link from "next/link";
import { Calendar, MessageSquare } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface CompanionBookingCardProps {
  id: string;
  hourlyRate: number;
  name: string;
  companionUserId: string;
}

export default function CompanionBookingCard({
  id,
  hourlyRate,
  name,
  companionUserId,
}: CompanionBookingCardProps) {
  const t = useTranslations("companionProfile");
  const locale = useLocale();
  
  // Extract first name for the message button, e.g. "Amina" from "Amina Al-Farsi"
  const firstName = name.split(" ")[0];

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft flex flex-col justify-between gap-6 h-full w-full">
      {/* Price Heading */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
          {t("startingFrom")}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-[#005c53]">
            ${hourlyRate.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
          </span>
          <span className="text-xs text-gray-500 font-bold">
            {t("perHour")}
          </span>
        </div>
      </div>

      <hr className="border-sand-high/40" />

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link 
          href={`/family/companions/${id}/request`}
          className="w-full bg-[#005c53] hover:bg-[#00473c] text-white py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-soft hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Calendar className="w-4.5 h-4.5" />
          {t("requestCare")}
        </Link>
        <Link 
          href={`/family/messages?companionId=${companionUserId}`}
          className="w-full bg-[#f4f3f0] hover:bg-gray-100 text-gray-800 py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <MessageSquare className="w-4.5 h-4.5 text-gray-600" />
          {t("messageCompanion", { name: firstName })}
        </Link>
      </div>
    </div>
  );
}
