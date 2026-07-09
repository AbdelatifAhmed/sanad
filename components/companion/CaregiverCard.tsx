"use client";

import Link from "next/link";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/avatar";
import { useTranslations, useLocale } from "next-intl";

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
  skills?: any[];
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
  skills = [],
  viewMode = "grid",
}: CaregiverCardProps) {
  const t = useTranslations("companionsPage");
  const locale = useLocale();

  const getDisplaySkills = () => {
    return skills
      .map((skill: any) => {
        if (typeof skill === "object" && skill !== null) {
          return locale === "ar" ? skill.nameAr : skill.nameEn;
        }
        if (typeof skill === "string" && !/^[0-9a-fA-F]{24}$/.test(skill)) {
          return skill;
        }
        return null;
      })
      .filter(Boolean) as string[];
  };

  if (viewMode === "list") {
    return (
      <div className="group bg-white rounded-3xl border border-sand-high/60 shadow-soft hover:shadow-premium transition-all duration-300 overflow-hidden flex flex-col md:flex-row hover:-translate-y-1 p-5 md:p-6 gap-5 md:gap-6">
        {/* Card Image - Small & Proportional */}
        <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-sand-low shrink-0 mx-auto md:mx-0 border border-sand-high/40 shadow-sm flex items-center justify-center">
          {avatar ? (
            <Image
              src={getAvatarUrl(avatar) || ""}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[15%] group-hover:grayscale-0"
              sizes="144px"
              onError={() => {}}
            />
          ) : (
            <div className="w-full h-full bg-teal-50 text-stitch-primary flex items-center justify-center font-bold text-2xl border border-teal-100 uppercase">
              {name ? name.slice(0, 2) : ""}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col flex-1 justify-between min-w-0">
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
              <div className="flex items-center gap-1.5 bg-sand-low text-stitch-primary px-2.5 py-1 rounded-md font-bold text-xs border border-sand-high/30">
                {t("rateDisplay", { rate: hourlyRate.toLocaleString(locale === "ar" ? "ar-EG" : "en-US") })}
              </div>
            </div>

            {/* Bio */}
            <p className="text-stitch-on-surface-variant text-xs md:text-sm leading-relaxed line-clamp-2 mb-3">
              {bio || t("defaultBio")}
            </p>

            {/* Service Tags (Skills) */}
            {(() => {
              const displaySkills = getDisplaySkills();
              if (displaySkills.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {displaySkills.slice(0, 4).map((skillName: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-stitch-primary/5 text-stitch-primary rounded-lg text-[10px] font-bold border border-stitch-primary/10 transition-colors"
                    >
                      {skillName}
                    </span>
                  ))}
                  {displaySkills.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-semibold">
                      +{displaySkills.length - 4}
                    </span>
                  )}
                </div>
              );
            })()}
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
      {/* Card Image - Small & Proportional */}
      <div className="relative h-40 overflow-hidden bg-sand-low shrink-0 flex items-center justify-center">
        {avatar ? (
          <Image
            src={getAvatarUrl(avatar) || ""}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[15%] group-hover:grayscale-0"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => {}}
          />
        ) : (
          <div className="w-full h-full bg-teal-50 text-stitch-primary flex items-center justify-center font-bold text-3xl border border-teal-100 uppercase">
            {name ? name.slice(0, 2) : ""}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Rate Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-stitch-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-stitch-outline/20">
          {t("rateDisplay", { rate: hourlyRate.toLocaleString(locale === "ar" ? "ar-EG" : "en-US") })}
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
        <p className="text-stitch-on-surface-variant text-xs leading-relaxed line-clamp-2 mb-3">
          {bio || t("defaultBio")}
        </p>

        {/* Service Tags (Skills) */}
        {(() => {
          const displaySkills = getDisplaySkills();
          if (displaySkills.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {displaySkills.slice(0, 3).map((skillName: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-stitch-primary/5 text-stitch-primary rounded-md text-[10px] font-bold border border-stitch-primary/10 transition-colors"
                >
                  {skillName}
                </span>
              ))}
              {displaySkills.length > 3 && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-semibold">
                  +{displaySkills.length - 3}
                </span>
              )}
            </div>
          );
        })()}

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
