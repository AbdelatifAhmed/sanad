import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { MapPin, AlertCircle, Check, Info } from "lucide-react";
import LocationPicker from "../auth/LocationPicker";

export const CITIES_BY_REGION: Record<string, string[]> = {
  "Muscat Governorate": ["Muscat", "Seeb", "Bawshar", "Muttrah"],
  "Riyadh Region": ["Riyadh", "Al Kharj", "Diriyah"],
  "Makkah Region": ["Jeddah", "Mecca", "Taif"],
  "Eastern Province": ["Dammam", "Al Khobar", "Dhahran", "Al Ahsa"],
  "Madinah Region": ["Medina", "Yanbu"],
  "Other": ["Abha", "Tabuk", "Hail"],
};

const GOVERNORATES = Object.keys(CITIES_BY_REGION);

interface LocationSelectionProps {
  governorate: string;
  city: string;
  streetAddress: string;
  onChangeGovernorate: (val: string) => void;
  onChangeCity: (val: string) => void;
  onChangeStreet: (val: string) => void;
  locationValue: any;
  onChangeLocation: (val: any) => void;
  errors?: Record<string, string>;
}

export default function LocationSelection({
  governorate,
  city,
  streetAddress,
  onChangeGovernorate,
  onChangeCity,
  onChangeStreet,
  locationValue,
  onChangeLocation,
  errors = {},
}: LocationSelectionProps) {
  const t = useTranslations("bookingForm");
  const locale = useLocale();
  const isAr = locale === "ar";
  const citiesFromRegion = governorate ? (CITIES_BY_REGION[governorate] ?? []) : [];
  const availableCities = city && !citiesFromRegion.includes(city)
    ? [...citiesFromRegion, city]
    : citiesFromRegion;

  const governorateList = governorate && !GOVERNORATES.includes(governorate)
    ? [...GOVERNORATES, governorate]
    : GOVERNORATES;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-sand-high/60">
        <MapPin className="w-5 h-5 text-[#005c53]" />
        <h3 className="font-display font-bold text-[#012d1d] text-lg">
          {t("location")}
        </h3>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Region / Governorate Select */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500" htmlFor="governorate">
            {t("regionGov")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="governorate"
              value={governorate}
              onChange={(e) => {
                onChangeGovernorate(e.target.value);
                onChangeCity("");
              }}
              className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all cursor-pointer appearance-none ${
                errors.governorate ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-sand-highest"
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" disabled>{t("selectRegion")}</option>
              {governorateList.map((g) => (
                <option key={g} value={g}>
                  {GOVERNORATES.includes(g) ? t(`regions.${g}` as any) : g}
                </option>
              ))}
            </select>
          </div>
          {errors.governorate && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.governorate}
            </p>
          )}
        </div>

        {/* City Select */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500" htmlFor="city">
            {t("city")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="city"
              value={city}
              disabled={!governorate}
              onChange={(e) => onChangeCity(e.target.value)}
              className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all cursor-pointer appearance-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                errors.city ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-sand-highest"
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" disabled>{governorate ? t("selectCity") : t("selectRegionFirst")}</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {errors.city && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.city}
            </p>
          )}
        </div>
      </div>

      {/* Street Address Input */}
      <div className="space-y-1.5 flex flex-col">
        <label className="text-xs font-bold text-gray-500" htmlFor="address">
          {t("streetAddress")} <span className="text-red-500">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            id="address"
            type="text"
            value={streetAddress}
            onChange={(e) => onChangeStreet(e.target.value)}
            placeholder={t("enterStreet")}
            className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all ${
              locationValue ? (isAr ? "pl-20" : "pr-20") : ""
            } ${
              errors.streetAddress ? "border-red-500 focus:border-red-500" : "border-[#bdc9c8]"
            }`}
          />
          {locationValue && (
            <div className={`absolute ${isAr ? "left-4" : "right-4"} text-[#1f8a8a] flex items-center gap-1 font-bold text-xs bg-[#e6f4f2] px-2.5 py-1.5 rounded-lg border border-[#bdc9c8]/20 animate-fade-in`}>
              <Check className="w-3.5 h-3.5" style={{ strokeWidth: 3 }} />
              <span>{t("locationPicker.gpsBadge")}</span>
            </div>
          )}
        </div>
        {errors.streetAddress && (
          <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="w-3 h-3" /> {errors.streetAddress}
          </p>
        )}
      </div>

      {/* Live Location Picker */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label className="block text-xs font-bold text-gray-500">{t("approximateLocation")}</label>
          <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-sand-high/40 w-fit">
            <Info className="w-3 h-3 text-gray-400 shrink-0" />
            <span>{t("exactPinShared")}</span>
          </div>
        </div>
        <LocationPicker value={locationValue} onChange={onChangeLocation} />
      </div>
    </div>
  );
}

