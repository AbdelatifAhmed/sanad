"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface FilterState {
  search: string;
  duration: string;
  rate: string;
  rating: string;
  specialization: string;
  gender: string;
  companionType: string;
}

interface CaregiverFiltersProps {
  filters: FilterState;
  totalCount: number;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearAll: () => void;
  onAiSearch?: (query: string) => void;
}

const SPECIALIZATION_CHIPS = [
  { translationKey: "chipAll", value: "", icon: "grid_view" },
  { translationKey: "chipMedical", value: "nursing", icon: "medical_services" },
  { translationKey: "chipCompanion", value: "companionship_companion", icon: "volunteer_activism" },
  { translationKey: "chipDementia", value: "dementia", icon: "psychology" },
  { translationKey: "chipPhysiotherapy", value: "physiotherapy", icon: "self_improvement" },
];

export default function CaregiverFilters({
  filters,
  totalCount,
  onFilterChange,
  onClearAll,
  onAiSearch,
}: CaregiverFiltersProps) {
  const t = useTranslations("companionsPage");
  const locale = useLocale();
  const hasActiveFilters =
    filters.duration ||
    filters.rate ||
    filters.rating ||
    filters.specialization ||
    filters.gender ||
    filters.companionType;


  return (
    <div className="space-y-4">
      {/* Search + Location Bar is removed, as it's now handled globally by SmartSearchBar */}
      <div className="bg-white rounded-2xl border border-sand-high/60 shadow-soft p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <span className="text-xs text-stitch-on-surface-variant font-medium hidden md:block">
              {t("foundCount", { count: totalCount })}
            </span>
            {hasActiveFilters && (
              <button
                onClick={onClearAll}
                className="text-xs font-bold text-stitch-primary hover:underline transition-all"
              >
                {t("clearAll")}
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filters Row */}
        <div className="mt-2 flex flex-wrap gap-4 items-center">
          {/* Duration */}
          <div className="flex flex-col gap-1 min-w-35">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              {t("durationLabel")}
            </label>
            <select
              value={filters.duration}
              onChange={(e) => onFilterChange("duration", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">{t("durationAny")}</option>
              <option value="100">{t("duration100")}</option>
              <option value="500">{t("duration500")}</option>
              <option value="1000">{t("duration1000")}</option>
              <option value="2000">{t("duration2000")}</option>
            </select>
          </div>

          <div className="w-px h-8 bg-sand-high/80 hidden md:block" />

          {/* Hourly Rate */}
          <div className="flex flex-col gap-1 min-w-35">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              {t("rateLabel")}
            </label>
            <select
              value={filters.rate}
              onChange={(e) => onFilterChange("rate", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">{t("rateAll")}</option>
              <option value="0-100">{t("rateUnder100")}</option>
              <option value="100-150">{t("rate100_150")}</option>
              <option value="150+">{t("rateOver150")}</option>
            </select>
          </div>

          <div className="w-px h-8 bg-sand-high/80 hidden md:block" />

          {/* Rating */}
          <div className="flex flex-col gap-1 min-w-35">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              {t("ratingLabel")}
            </label>
            <select
              value={filters.rating}
              onChange={(e) => onFilterChange("rating", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">{t("ratingAny")}</option>
              <option value="4.5">{t("rating45")}</option>
              <option value="4.0">{t("rating40")}</option>
              <option value="3.0">{t("rating30")}</option>
            </select>
          </div>

          <div className="w-px h-8 bg-sand-high/80 hidden md:block" />

          {/* Gender */}
          <div className="flex flex-col gap-1 min-w-35">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              {locale === "ar" ? "الجنس" : "Gender"}
            </label>
            <select
              value={filters.gender}
              onChange={(e) => onFilterChange("gender", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">{locale === "ar" ? "الكل" : "Any"}</option>
              <option value="male">{locale === "ar" ? "ذكر" : "Male"}</option>
              <option value="female">{locale === "ar" ? "أنثى" : "Female"}</option>
            </select>
          </div>

          <div className="w-px h-8 bg-sand-high/80 hidden md:block" />

          {/* Companion Type */}
          <div className="flex flex-col gap-1 min-w-35">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              {locale === "ar" ? "النوع" : "Type"}
            </label>
            <select
              value={filters.companionType}
              onChange={(e) => onFilterChange("companionType", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">{locale === "ar" ? "الكل" : "Any"}</option>
              <option value="general">{locale === "ar" ? "عام" : "General"}</option>
              <option value="specialized">{locale === "ar" ? "متخصص" : "Specialized"}</option>
            </select>
          </div>

          {/* Mobile count */}
          <div className="ml-auto md:hidden">
            <span className="text-xs text-stitch-on-surface-variant font-medium">
              {t("foundCountMobile", { count: totalCount })}
            </span>
          </div>
        </div>
      </div>

      {/* Specialization Chips */}
      <div className="flex flex-wrap gap-2">
        {SPECIALIZATION_CHIPS.map((chip) => {
          const isActive = filters.specialization === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onFilterChange("specialization", chip.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                isActive
                  ? "bg-stitch-secondary-container text-stitch-on-secondary-container border-stitch-primary/30 shadow-sm"
                  : "bg-white text-stitch-on-surface-variant border-sand-high/60 hover:bg-sand-low hover:border-stitch-primary/20"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{chip.icon}</span>
              {t(chip.translationKey as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>
    </div>
  );
}
