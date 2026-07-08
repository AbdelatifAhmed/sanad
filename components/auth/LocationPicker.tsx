"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useTranslations } from "next-intl";
import SharedMap from "@/components/shared/SharedMap";

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

  const address = location?.readableAddress || "";

  // Convert [lon, lat] (Mongoose) to Leaflet [lat, lon]
  const rawCoords = location?.geo?.coordinates;
  const mapCenter: [number, number] = rawCoords && rawCoords.length === 2
    ? [rawCoords[1], rawCoords[0]]
    : [24.7136, 46.6753]; // Default to Riyadh

  const handleMapChange = async (latLng: [number, number]) => {
    const [lat, lng] = latLng;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en, ar",
            "User-Agent": "SanadApp/1.0",
          },
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const resGov = data.address.state || data.address.province || data.address.county || "";
        const resCity = data.address.city || data.address.town || data.address.village || data.address.suburb || resGov || "";
        const resAddress = data.display_name || "";

        updateLocation({
          geo: { type: 'Point', coordinates: [lng, lat] },
          readableAddress: resAddress,
          city: resCity,
          governorate: resGov
        });
      }
    } catch (err) {
      console.error("Reverse Geocoding Error on map click:", err);
      updateLocation({
        geo: { type: 'Point', coordinates: [lng, lat] },
        readableAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: location?.city || "",
        governorate: location?.governorate || ""
      });
    }
  };

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
        await handleMapChange([latitude, longitude]);
        setLoading(false);
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

        {/* Reusable Interactive OSM Leaflet Map Picker */}
        <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-[#bdc9c8] shadow-inner">
          <SharedMap center={mapCenter} readOnly={false} zoom={13} onChange={handleMapChange} />
        </div>

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
    <div className="space-y-3">
      {location ? (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-[#e6f4f2]/40 border border-[#bdc9c8]/40 rounded-xl gap-3 transition-all duration-300">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto text-left">
            <div className="w-8.5 h-8.5 bg-[#e6f4f2] text-[#005c53] flex items-center justify-center rounded-lg shrink-0 shadow-sm">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-[#012d1d]">
                {t("capturedTitle")}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold truncate max-w-full">
                {address || `${location.geo.coordinates[1].toFixed(4)}, ${location.geo.coordinates[0].toFixed(4)}`}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#bdc9c8] text-gray-600 bg-white rounded-lg font-bold text-[11px] hover:bg-[#fcf9f6] transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3 text-[#005c53]" />
            )}
            {loading ? t("detecting") : t("updateLocation")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-[#fcf9f6] border border-sand-high rounded-xl gap-3 transition-all duration-300">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8.5 h-8.5 bg-white border border-sand-high text-gray-400 flex items-center justify-center rounded-lg shrink-0 shadow-sm">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#012d1d]">{t("shareTitle")}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{t("shareDesc")}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#005c53] hover:bg-[#00473c] text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer animate-pulse"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Navigation className="w-3 h-3 text-white" />
            )}
            {loading ? t("detecting") : t("detectMy")}
          </button>
        </div>
      )}

      {/* Map Picker */}
      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[#bdc9c8] shadow-inner">
        <SharedMap center={mapCenter} readOnly={false} zoom={13} onChange={handleMapChange} />
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}