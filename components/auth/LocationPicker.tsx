"use client";

import React, { useState } from "react"; // 💡 قمنا بحذف useEffect
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useTranslations } from "next-intl";

interface LocationData {
  geo: { type: 'Point'; coordinates: [number, number] }; // [long, lat]
  readableAddress: string;
  city: string;
  governorate: string;
}

interface LocationPickerProps {
  value?: LocationData | null;
  onChange?: (val: LocationData) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const registerStore = useRegisterStore();
  const isControlled = onChange !== undefined;
  const location = isControlled ? value : registerStore.location;
  const t = useTranslations("bookingForm.locationPicker");

  const updateLocation = (newLoc: LocationData) => {
    if (isControlled && onChange) {
      onChange(newLoc);
    } else {
      registerStore.updateLocation(newLoc);
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 💡Derived State: نقوم بحساب العنوان مباشرة أثناء الـ Render بدون State إضافي وبدون useEffect
  const address = location?.readableAddress || "";

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t("geoNotSupported"));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use Nominatim for Reverse Geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'ar, en',
                'User-Agent': 'SanadApp/1.0'
              }
            }
          );
          const data = await response.json();
          
          const city = data.address.city || data.address.town || data.address.village || "";
          const governorate = data.address.state || data.address.province || "";
          const readableAddress = data.display_name || "";

          // التحديث هنا في الـ Store سيعيد رندر المكون تلقائيًا بالعنوان الجديد
          updateLocation({
            geo: { type: 'Point', coordinates: [longitude, latitude] },
            readableAddress,
            city,
            governorate
          });
          
        } catch (err) {
          console.error("Reverse Geocoding Error:", err);
          setError(t("geocodeFailed"));
          
          updateLocation({
            geo: { type: 'Point', coordinates: [longitude, latitude] },
            readableAddress: t("unknownLocation"),
            city: t("unknown"),
            governorate: t("unknown")
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation Error:", err);
        setError(t("enablePermissions"));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Sleek Row-Based UI for the Care Booking Form (Controlled Mode)
  if (isControlled) {
    return (
      <div className="space-y-3">
        {location ? (
          /* Location is set / captured */
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#e6f4f2]/40 border border-[#bdc9c8]/40 rounded-2xl gap-4 transition-all duration-300">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 bg-[#e6f4f2] text-[#005c53] flex items-center justify-center rounded-xl shrink-0 shadow-sm border border-[#005c53]/10">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#012d1d]">
                  {t("capturedTitle")}
                </p>
                <p className="text-xs text-gray-500 font-semibold truncate max-w-full">
                  {address || `${location.geo.coordinates[1].toFixed(4)}, ${location.geo.coordinates[0].toFixed(4)}`}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-[#bdc9c8] text-gray-600 bg-white rounded-xl font-bold text-xs hover:bg-[#fcf9f6] hover:border-gray-400 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-gray-500" />
              )}
              {loading ? t("detecting") : t("updateLocation")}
            </button>
          </div>
        ) : (
          /* Location is not set */
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#fcf9f6] border border-sand-high rounded-2xl gap-4 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-sand-high/80 text-[#005c53] flex items-center justify-center rounded-xl shrink-0 shadow-sm">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#012d1d]">
                  {t("shareTitle")}
                </p>
                <p className="text-xs text-gray-400 font-semibold">
                  {t("shareDesc")}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#005c53] hover:bg-[#00473c] text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 shrink-0 cursor-pointer animate-pulse"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-white" />
              )}
              {loading ? t("detecting") : t("detectMy")}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Classic UI for Registration Flow
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 space-y-4 transition-all hover:border-[#005c53]/40">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${location ? 'bg-[#e6f4f2] text-[#005c53]' : 'bg-white text-gray-400'}`}>
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : location ? (
            <CheckCircle className="w-8 h-8 text-[#005c53]" />
          ) : (
            <MapPin className="w-8 h-8" />
          )}
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-bold text-gray-800">
            {location ? t("capturedTitle") : t("shareTitle")}
          </h3>
          <p className="text-xs text-gray-500 max-w-60 mx-auto font-medium">
            {location 
              ? t("capturedDesc") 
              : t("shareDesc")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGetLocation}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 hover:border-[#005c53]/30 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-[#005c53]" />
          {loading ? t("detecting") : location ? t("updateLocation") : t("detectMy")}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {location && (
        <div className="p-4 bg-[#e6f4f2]/30 border border-[#bdc9c8]/40 rounded-2xl space-y-2 animate-fade-in">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#005c53]">{t("currentAddress")}</span>
            <CheckCircle className="w-4 h-4 text-[#005c53]" />
          </div>
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            {address}
          </p>
          <div className="flex gap-4 pt-1">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase">{t("city")}</span>
              <p className="text-xs font-bold text-gray-700">{location.city || "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase">{t("governorate")}</span>
              <p className="text-xs font-bold text-gray-700">{location.governorate || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}