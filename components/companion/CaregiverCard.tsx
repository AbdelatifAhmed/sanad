"use client";

import Link from "next/link";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/avatar";
import { useTranslations } from "next-intl";

interface CaregiverCardProps {
  id: string;
  name: string;
  avatar: any;
  title: string;
  rating: number;
  reviewsCount: number;
  location: string;
  hourlyRate: number;
  bio: string;
  specialization?: string;
  viewMode?: "grid" | "list";
}

export default function CaregiverCard({
  id,
  name,
  avatar,
  title,
  rating,
  reviewsCount,
  location,
  hourlyRate,
  bio,
  viewMode = "grid",
}: CaregiverCardProps) {
  const t = useTranslations("companionsPage");

  if (viewMode === "list") {
    return (
      <div className="group bg-white rounded-3xl border border-sand-high/60 shadow-soft hover:shadow-premium transition-all duration-300 overflow-hidden flex flex-col md:flex-row hover:-translate-y-1">
        {/* Card Image */}
        <div className="relative w-full md:w-64 h-52 md:h-auto overflow-hidden bg-sand-low shrink-0 min-h-[208px]">
          <Image
            src={getAvatarUrl(avatar, "/avatar_1.jpg") || "/avatar_1.jpg"}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[15%] group-hover:grayscale-0"
            sizes="(max-width: 768px) 100vw, 256px"
            onError={() => {}}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent md:hidden" />

          {/* Rate Badge on mobile */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-stitch-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-stitch-outline/20 md:hidden">
            {t("rateDisplay", { rate: hourlyRate })}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-col flex-1 p-5 md:p-6 justify-between">
          <div>
            {/* Name & Rating */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-stitch-display font-bold text-base md:text-lg text-[#012d1d] truncate">
                  {name}
                </h3>
                <p className="text-stitch-primary text-xs md:text-sm font-semibold mt-0.5 truncate">
                  {title}
                </p>
              </div>

              {/* Rating and Reviews */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0.5 shrink-0">
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="material-symbols-outlined text-[16px] [font-variation-settings:'FILL'_1]">
                    star
                  </span>
                  <span className="text-[#012d1d] font-bold text-sm">{rating.toFixed(1)}</span>
                </div>
                <span className="text-[10px] text-stitch-on-surface-variant">
                  {t("reviewsCount", { count: reviewsCount })}
                </span>
              </div>
            </div>

            {/* Location & Desktop Rate */}
            <div className="flex flex-wrap items-center gap-3 text-stitch-on-surface-variant text-xs mb-3 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                <span className="truncate">{location}</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 bg-sand-low text-stitch-primary px-2.5 py-1 rounded-md font-bold text-xs border border-sand-high/30">
                {t("rateDisplay", { rate: hourlyRate })}
              </div>
            </div>

            {/* Bio */}
            <p className="text-stitch-on-surface-variant text-xs md:text-sm leading-relaxed line-clamp-3 mb-4">
              {bio || t("defaultBio")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-4 border-t border-sand-high/60 items-center justify-end">
            <Link
              href={`/family/companions/${id}`}
              className="px-6 py-2.5 text-center text-xs font-bold border border-stitch-primary text-stitch-primary rounded-xl hover:bg-stitch-primary/5 transition-all w-full sm:w-auto"
            >
              {t("viewProfile")}
            </Link>
            <Link
              href={`/family/companions/${id}/request`}
              className="px-6 py-2.5 text-center text-xs font-bold bg-stitch-primary text-white rounded-xl hover:shadow-md hover:opacity-90 transition-all active:scale-95 w-full sm:w-auto"
            >
              {t("bookNow")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-3xl border border-sand-high/60 shadow-soft hover:shadow-premium transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
      {/* Card Image */}
      <div className="relative h-52 overflow-hidden bg-sand-low shrink-0">
        <Image
          src={getAvatarUrl(avatar, "/avatar_1.jpg") || "/avatar_1.jpg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[15%] group-hover:grayscale-0"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {}}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Rate Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-stitch-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-stitch-outline/20">
          {t("rateDisplay", { rate: hourlyRate })}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Name & Rating */}
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-stitch-display font-bold text-base text-[#012d1d] truncate">
              {name}
            </h3>
            <p className="text-stitch-primary text-xs font-semibold mt-0.5 truncate">
              {title}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-amber-500">
              <span className="material-symbols-outlined text-[16px] [font-variation-settings:'FILL'_1]">
                star
              </span>
              <span className="text-[#012d1d] font-bold text-sm">{rating.toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-stitch-on-surface-variant mt-0.5">
              {t("reviewsCount", { count: reviewsCount })}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-stitch-on-surface-variant text-xs mb-3 mt-1">
          <span className="material-symbols-outlined text-[15px]">location_on</span>
          <span className="truncate">{location}</span>
        </div>

        {/* Bio */}
        <p className="text-stitch-on-surface-variant text-xs leading-relaxed line-clamp-2 flex-1 mb-4">
          {bio || t("defaultBio")}
        </p>

        {/* Actions */}
        <div className="flex gap-2.5 mt-auto pt-4 border-t border-sand-high/60">
          <Link
            href={`/family/companions/${id}`}
            className="flex-1 py-2.5 text-center text-xs font-bold border border-stitch-primary text-stitch-primary rounded-xl hover:bg-stitch-primary/5 transition-all"
          >
            {t("viewProfile")}
          </Link>
          <Link
            href={`/family/companions/${id}/request`}
            className="flex-1 py-2.5 text-center text-xs font-bold bg-stitch-primary text-white rounded-xl hover:shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            {t("bookNow")}
          </Link>
        </div>
      </div>
    </div>
  );
}
