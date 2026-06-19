import React from "react";
import { useTranslations } from "next-intl";
import { MapPin, AlertCircle } from "lucide-react";

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
  errors?: Record<string, string>;
}

export default function LocationSelection({
  governorate,
  city,
  streetAddress,
  onChangeGovernorate,
  onChangeCity,
  onChangeStreet,
  errors = {},
}: LocationSelectionProps) {
  const t = useTranslations("bookingForm");
  const availableCities = governorate ? (CITIES_BY_REGION[governorate] ?? []) : [];

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
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>{t(`regions.${g}` as any)}</option>
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
        <input
          id="address"
          type="text"
          value={streetAddress}
          onChange={(e) => onChangeStreet(e.target.value)}
          placeholder={t("enterStreet")}
          className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all ${
            errors.streetAddress ? "border-red-500 focus:border-red-500" : "border-sand-highest"
          }`}
        />
        {errors.streetAddress && (
          <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="w-3 h-3" /> {errors.streetAddress}
          </p>
        )}
      </div>

      {/* Approximate Location Map Placeholder */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500">{t("approximateLocation")}</label>
        <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-sand-high group">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(31,138,138,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(31,138,138,0.06) 1px, transparent 1px)
              `,
              backgroundSize: "36px 36px",
              backgroundColor: "#e8f4f4",
            }}
          />
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-1/3 left-0 right-0 h-3 bg-white rounded" />
            <div className="absolute top-2/3 left-0 right-0 h-2 bg-white rounded" />
            <div className="absolute left-1/4 top-0 bottom-0 w-2 bg-white rounded" />
            <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-white rounded" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white p-3.5 rounded-full shadow-lg border-2 border-[#005c53]">
              <MapPin className="w-6 h-6 text-[#005c53] fill-[#005c53]/10" />
            </div>
          </div>
          {city && (
            <div className="absolute top-3 right-3 bg-[#005c53] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              {city}
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-sand-high/30 flex items-center gap-2 shadow-sm text-xs font-semibold text-[#012d1d]">
            <span className="material-symbols-outlined text-[#005c53]" style={{ fontSize: "14px" }}>info</span>
            {t("exactPinShared")}
          </div>
        </div>
      </div>
    </div>
  );
}

