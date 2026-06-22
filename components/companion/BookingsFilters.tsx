import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { serverFetch } from "@/lib/serverAuth";
import CustomSelect from "./CustomSelect";

interface BookingsFiltersProps {
  filters: {
    location: string;
    nearMe: boolean;
    careType: string;
    date: string;
    maxDistanceInKm: string;
  };
}

export default async function BookingsFilters({ filters }: BookingsFiltersProps) {
  const t = await getTranslations("companionBookings");
  const locale = await getLocale();

  // Load service types dynamically from the backend Mongoose schema path enums
  let serviceTypes: string[] = [];
  try {
    const data = await serverFetch("/job-posts/service-types");
    if (data && data.serviceTypes) {
      serviceTypes = data.serviceTypes;
    }
  } catch (error) {
    console.error("Failed to load service types from backend:", error);
    // Dynamic fallback options matching current mongoose enums
    serviceTypes = [
      "elderly_care",
      "child_care",
      "home_nursing",
      "physical_therapy",
      "companionship",
    ];
  }

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
        // Fallback title casing for any missing locales
        label = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return { label, value: type };
    }),
  ];

  const dateOptions = [
    { label: t("anytime"), value: "all" },
    { label: locale === "ar" ? "اليوم" : "Today", value: "today" },
    { label: locale === "ar" ? "غداً" : "Tomorrow", value: "tomorrow" },
  ];

  const distanceOptions = [
    { label: locale === "ar" ? "20 كم (افتراضي)" : "20 km (Default)", value: "20" },
    { label: locale === "ar" ? "40 كم" : "40 km", value: "40" },
    { label: locale === "ar" ? "60 كم" : "60 km", value: "60" },
    { label: locale === "ar" ? "80 كم" : "80 km", value: "80" },
  ];

  return (
    <form
      action="/companion/bookings"
      method="GET"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center"
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

      {/* Date Filter */}
      <CustomSelect
        name="date"
        label={t("date")}
        icon="calendar_today"
        defaultValue={filters.date}
        options={dateOptions}
      />

      {/* Near Me Filter Label containing hidden checkbox and peer-checked visual switch */}
      <label className="group bg-white p-3.5 rounded-2xl border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center gap-2 cursor-pointer hover:bg-gray-50/50 hover:border-stitch-outline/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all select-none has-[:checked]:bg-[#005f56] has-[:checked]:border-[#005f56] has-[:checked]:text-white min-h-[72px]">
        <input
          type="checkbox"
          name="nearMe"
          value="true"
          defaultChecked={filters.nearMe}
          className="sr-only"
        />
        <span className="material-symbols-outlined text-[#005f56] text-xl transition-colors group-has-[:checked]:text-white">near_me</span>
        <div className="flex-1 min-w-0">
          <span className="block text-[9px] font-bold text-stitch-on-surface-variant/40 tracking-wider uppercase transition-colors group-has-[:checked]:text-white/60">
            {t("nearMe")}
          </span>
          <span className="block text-xs font-extrabold text-stitch-on-surface mt-0.5 group-has-[:checked]:hidden">
            {t("nearMeInactive")}
          </span>
          <span className="hidden text-xs font-extrabold text-white mt-0.5 group-has-[:checked]:block">
            {t("nearMeActive")}
          </span>
        </div>
        <div className="w-8 h-5 rounded-full relative flex items-center px-0.5 bg-gray-200 group-has-[:checked]:bg-white/25 transition-colors duration-200">
          <div className="w-4 h-4 rounded-full bg-gray-400 group-has-[:checked]:bg-white transition-transform duration-200 transform translate-x-0 group-has-[:checked]:translate-x-3 rtl:group-has-[:checked]:-translate-x-3"></div>
        </div>
      </label>

      {/* Distance Filter */}
      <CustomSelect
        name="maxDistanceInKm"
        label={t("distanceLimit")}
        icon="explore"
        defaultValue={filters.maxDistanceInKm}
        options={distanceOptions}
      />

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
