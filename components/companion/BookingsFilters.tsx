"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import CustomSelect from "./CustomSelect";
import DateRangePicker from "./DateRangePicker";

interface BookingsFiltersProps {
  filters: {
    location: string;
    nearMe: boolean;
    careType: string;
    date: string;
    maxDistanceInKm: string;
    startDate?: string;
    endDate?: string;
  };
  serviceTypes: string[];
}

export default function BookingsFilters({ filters, serviceTypes }: BookingsFiltersProps) {
  const t = useTranslations("companionBookings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [nearMeEnabled, setNearMeEnabled] = useState(filters.nearMe);
  const [selectedDistance, setSelectedDistance] = useState(filters.maxDistanceInKm);
  const [distanceDropdownOpen, setDistanceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close distance dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDistanceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update states when filters prop changes
  useEffect(() => {
    setNearMeEnabled(filters.nearMe);
  }, [filters.nearMe]);

  useEffect(() => {
    setSelectedDistance(filters.maxDistanceInKm);
  }, [filters.maxDistanceInKm]);

  const locationOptions = [
    { label: locale === "ar" ? "كل المواقع" : "All Locations", value: "all" },
    { label: locale === "ar" ? "الرياض" : "Riyadh", value: "Riyadh" },
    { label: locale === "ar" ? "جدة" : "Jeddah", value: "Jeddah" },
  ];

  const careTypeOptions = [
    { label: t("allServices"), value: "all" },
    ...serviceTypes.map((type) => {
      let label = type;
      try {
        label = t(type as any);
      } catch {
        label = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return { label, value: type };
    }),
  ];



  const distanceOptions = [
    { label: locale === "ar" ? "20 كم" : "20 km", value: "20" },
    { label: locale === "ar" ? "40 كم" : "40 km", value: "40" },
    { label: locale === "ar" ? "60 كم" : "60 km", value: "60" },
    { label: locale === "ar" ? "80 كم" : "80 km", value: "80" },
  ];

  const activeDistanceOption = distanceOptions.find((o) => o.value === selectedDistance) || distanceOptions[0];

  const handleNearMeCardClick = () => {
    if (!nearMeEnabled) {
      setNearMeEnabled(true);
    } else {
      setDistanceDropdownOpen(!distanceDropdownOpen);
    }
  };

  const handleToggleSwitch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !nearMeEnabled;
    setNearMeEnabled(nextState);
    if (!nextState) {
      setDistanceDropdownOpen(false);
    }
  };

  const isRtl = locale === "ar";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    formData.forEach((value, key) => {
      if (value) {
        params.set(key, value.toString());
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center"
    >
      {/* Location Filter */}
      <CustomSelect
        name="location"
        label={t("location")}
        icon="location_on"
        defaultValue={filters.location}
        options={locationOptions}
      />

      {/* Care Type Filter */}
      <CustomSelect
        name="careType"
        label={t("careType")}
        icon="medical_services"
        defaultValue={filters.careType}
        options={careTypeOptions}
      />

      {/* Date Filter (Calendar Date Range Picker) */}
      <DateRangePicker
        label={t("date")}
        defaultStartDate={filters.startDate || ""}
        defaultEndDate={filters.endDate || ""}
        locale={locale}
        anytimeLabel={t("anytime")}
      />

      {/* Near Me + Distance Filter */}
      <div
        ref={dropdownRef}
        className={`p-3.5 rounded-2xl border shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center justify-between relative cursor-pointer select-none min-h-[72px] transition-all duration-200 ${
          nearMeEnabled
            ? "bg-white border-[#005f56]/30 shadow-[0_4px_20px_rgba(0,95,86,0.05)]"
            : "bg-white border-gray-100 hover:border-stitch-outline/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
        }`}
        onClick={handleNearMeCardClick}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`material-symbols-outlined text-xl shrink-0 transition-colors duration-200 ${
              nearMeEnabled ? "text-[#005f56]" : "text-stitch-on-surface-variant/40"
            }`}
          >
            near_me
          </span>
          <div className="flex-1 min-w-0">
            <span className="block text-[9px] font-bold text-stitch-on-surface-variant/40 tracking-wider uppercase">
              {t("nearMe")}
            </span>
            <span
              className={`block text-xs font-extrabold transition-colors duration-200 mt-0.5 ${
                nearMeEnabled ? "text-[#005f56]" : "text-stitch-on-surface truncate"
              }`}
            >
              {nearMeEnabled ? activeDistanceOption.label : t("nearMeInactive")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Switch */}
          <div
            onClick={handleToggleSwitch}
            className={`w-8 h-5 rounded-full relative flex items-center px-0.5 transition-colors duration-200 cursor-pointer ${
              nearMeEnabled ? "bg-[#005f56]" : "bg-gray-200"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                nearMeEnabled
                  ? isRtl
                    ? "-translate-x-3"
                    : "translate-x-3"
                  : "translate-x-0"
              }`}
            ></div>
          </div>

          {/* Dropdown Indicator (only when active) */}
          {nearMeEnabled && (
            <span
              className={`material-symbols-outlined text-stitch-on-surface-variant/40 transition-transform shrink-0 ${
                distanceDropdownOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          )}
        </div>

        {/* Hidden inputs for form submit */}
        {nearMeEnabled && (
          <>
            <input type="hidden" name="nearMe" value="true" />
            <input type="hidden" name="maxDistanceInKm" value={selectedDistance} />
          </>
        )}

        {/* Distance Dropdown Menu */}
        {distanceDropdownOpen && nearMeEnabled && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-50 py-1.5 max-h-60 overflow-y-auto animate-fade-in">
            {distanceOptions.map((option) => {
              const isSelected = option.value === selectedDistance;
              return (
                <div
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDistance(option.value);
                    setDistanceDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${
                    isSelected ? "text-[#005f56] bg-[#005f56]/5" : "text-stitch-on-surface"
                  }`}
                >
                  {option.label}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 h-full lg:col-span-1 sm:col-span-2">
        <button
          type="submit"
          className="flex-1 h-[72px] bg-[#005f56] hover:bg-[#004e46] text-white font-extrabold rounded-2xl shadow-sm transition-colors text-sm flex items-center justify-center cursor-pointer border-none"
        >
          {t("applyFilters")}
        </button>
        <Link
          href="/companion/bookings"
          className="w-[72px] h-[72px] bg-white hover:bg-gray-50 border border-stitch-outline/10 shadow-soft rounded-2xl flex items-center justify-center text-stitch-on-surface-variant/60 hover:text-stitch-on-surface transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
        </Link>
      </div>
    </form>
  );
}
