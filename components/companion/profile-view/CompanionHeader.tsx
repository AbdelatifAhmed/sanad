"use client";

import React from "react";
import { Star, MapPin, Briefcase, CheckCircle } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { useTranslations } from "next-intl";

interface CompanionHeaderProps {
  name: string;
  avatar: any;
  verified: boolean;
  title: string;
  rating: number;
  reviewsCount: number;
  location: string;
  experience: string;
}

export default function CompanionHeader({
  name,
  avatar,
  verified,
  title,
  rating,
  reviewsCount,
  location,
  experience,
}: CompanionHeaderProps) {
  const t = useTranslations("companionProfile");

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft flex flex-col md:flex-row items-center md:items-start gap-6 h-full w-full">
      {/* Round Avatar with online indicator */}
      <div className="relative shrink-0">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-[#005c53]/10 shadow-md">
          <img 
            src={getAvatarUrl(avatar, "/avatar_3.jpg") || "/avatar_3.jpg"} 
            alt={name} 
            className="w-full h-full object-cover" 
          />
        </div>
        <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
      </div>

      {/* Profile Info Details */}
      <div className="space-y-3 text-center md:text-left flex-1">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 flex-wrap justify-center md:justify-start">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#012d1d]">
            {name}
          </h1>
          {verified && (
            <span className="w-fit mx-auto md:mx-0 flex items-center gap-1.5 bg-[#e6f4f2] text-[#005c53] font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-[#c8e6c9]/20">
              <CheckCircle className="w-3.5 h-3.5 fill-[#005c53] text-white" />
              {t("verifiedProfessional")}
            </span>
          )}
        </div>
        
        <p className="text-gray-500 text-sm md:text-base font-semibold">
          {title}
        </p>

        {/* Stats Layout */}
        <div className="space-y-2.5 pt-1 text-xs md:text-sm font-semibold text-gray-500">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <Star className="w-4 h-4 fill-current text-amber-500" />
              <span className="text-gray-800">{rating}</span>
            </div>
            <span className="text-gray-400 font-medium">{t("reviewsCount", { count: reviewsCount })}</span>
            <span className="text-gray-300 font-light px-1">•</span>
            <div className="flex items-center gap-1 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="text-gray-500">{location}</span>
            </div>
            <span className="text-gray-300 font-light px-1">•</span>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-gray-500">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span>{experience}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
