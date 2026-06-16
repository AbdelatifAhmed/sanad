"use client";

import React, { useState } from "react"; // 💡 قمنا بحذف useEffect
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";

export default function LocationPicker() {
  const { location, updateLocation } = useRegisterStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 💡Derived State: نقوم بحساب العنوان مباشرة أثناء الـ Render بدون State إضافي وبدون useEffect
  const address = location?.readableAddress || "";

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
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
          setError("Failed to get address details. Please try again.");
          
          updateLocation({
            geo: { type: 'Point', coordinates: [longitude, latitude] },
            readableAddress: "Unknown Location",
            city: "Unknown",
            governorate: "Unknown"
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation Error:", err);
        setError("Please enable location permissions in your browser.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 space-y-4 transition-all hover:border-primary/50">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${location ? 'bg-teal-50 text-primary' : 'bg-white text-gray-400'}`}>
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : location ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <MapPin className="w-8 h-8" />
          )}
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-bold text-gray-800">
            {location ? "Location Captured" : "Share Your Location"}
          </h3>
          <p className="text-xs text-gray-500 max-w-60 mx-auto font-medium">
            {location 
              ? "We've successfully detected your area for better matching." 
              : "Allow us to detect your location to connect you with nearby services."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGetLocation}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 hover:border-primary/30 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <Navigation className="w-4 h-4 text-primary" />
          {loading ? "Detecting..." : location ? "Update Location" : "Detect My Location"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {location && (
        <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-2 animate-fade-in">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Current Address</span>
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            {address}
          </p>
          <div className="flex gap-4 pt-1">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase">City</span>
              <p className="text-xs font-bold text-gray-700">{location.city || "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Governorate</span>
              <p className="text-xs font-bold text-gray-700">{location.governorate || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}