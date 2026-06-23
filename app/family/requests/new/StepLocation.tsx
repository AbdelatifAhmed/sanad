"use client";

import { useState } from "react";
import { CareRequestFormData } from "@/lib/types/care-request";
import SharedMap from "@/components/shared/SharedMap";

type Step3Data = Pick<CareRequestFormData, "locationData">;

interface StepLocationProps {
  defaultValues: Step3Data;
  onSubmit: (data: Step3Data) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const CITIES_BY_REGION: Record<string, string[]> = {
  "Riyadh Region": ["Riyadh", "Al Kharj", "Diriyah"],
  "Makkah Region": ["Jeddah", "Mecca", "Taif"],
  "Eastern Province": ["Dammam", "Al Khobar", "Dhahran", "Al Ahsa"],
  "Madinah Region": ["Medina", "Yanbu"],
  "Other": ["Abha", "Tabuk", "Hail"],
};

const GOVERNORATES = Object.keys(CITIES_BY_REGION);

export default function StepLocation({ defaultValues, onSubmit, onBack, isSubmitting }: StepLocationProps) {
  const loc = defaultValues.locationData;

  const [city, setCity] = useState(loc.city);
  const [governorate, setGovernorate] = useState(loc.governorate);
  const [readableAddress, setReadableAddress] = useState(loc.readableAddress);
  const [coordinates, setCoordinates] = useState<[number, number]>(
    loc.coordinates || [46.6753, 24.7136] // [longitude, latitude] (Riyadh default)
  );
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamically include custom governorates/regions if detected via GPS/Map
  const governorateList = governorate && !GOVERNORATES.includes(governorate)
    ? [...GOVERNORATES, governorate]
    : GOVERNORATES;

  const citiesFromRegion = governorate ? (CITIES_BY_REGION[governorate] ?? []) : [];
  const availableCities = city && !citiesFromRegion.includes(city)
    ? [...citiesFromRegion, city]
    : citiesFromRegion;

  // Convert [lon, lat] to Leaflet [lat, lon]
  const leafletCenter: [number, number] = [coordinates[1], coordinates[0]];

  const handleMapChange = async (latLng: [number, number]) => {
    const [lat, lng] = latLng;
    setCoordinates([lng, lat]); // Mongoose expects [longitude, latitude]

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
        // Detect state/province first so we can fall back to it
        const resGov = data.address.state || data.address.province || data.address.county || "";
        // Detect city with county and state fallbacks so it is never blank
        const resCity = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.city_district || resGov || "";
        const resAddress = data.display_name || "";

        if (resCity) {
          setCity(resCity);
          setErrors((er) => ({ ...er, city: "" }));
        }
        
        // Find best match for Governorate
        if (resGov) {
          const matchedGov = GOVERNORATES.find((g) => 
            g.toLowerCase().includes(resGov.toLowerCase()) || 
            resGov.toLowerCase().includes(g.toLowerCase())
          );
          if (matchedGov) {
            setGovernorate(matchedGov);
            setErrors((er) => ({ ...er, governorate: "" }));
          } else {
            setGovernorate(resGov);
            setErrors((er) => ({ ...er, governorate: "" }));
          }
        }
        if (resAddress) {
          setReadableAddress(resAddress);
          setErrors((er) => ({ ...er, readableAddress: "" }));
        }
      }
    } catch (err) {
      console.error("Reverse geocoding error on map click:", err);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await handleMapChange([latitude, longitude]);
        setLoadingLoc(false);
      },
      (error) => {
        console.error("GPS detection error:", error);
        alert("Failed to get your coordinates. Please grant location permissions.");
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!governorate) errs.governorate = "Please select a region/governorate.";
    if (!city) errs.city = "Please select a city.";
    if (!readableAddress.trim()) errs.readableAddress = "Street address is required.";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      locationData: {
        city,
        governorate,
        readableAddress,
        notes: "",
        coordinates, // Pass chosen map coordinates
      },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-[#1b1c1c] mb-1">Where do you need care?</h2>
        <p className="text-sm text-[#3e4949]">
          Provide the service location so we can find the nearest available caregivers.
        </p>
      </div>

      {/* Region / Governorate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="governorate">
            Region / Governorate <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="governorate"
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value);
                setCity("");
                setErrors((er) => ({ ...er, governorate: "", city: "" }));
              }}
              className="w-full h-14 appearance-none bg-white border border-[#bdc9c8] rounded-xl px-4 pr-12 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all cursor-pointer"
            >
              <option value="" disabled>Select a region</option>
              {governorateList.map((g) => (
                <option key={g} value={g}>
                  {GOVERNORATES.includes(g) ? g : g}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#3e4949]">
              keyboard_arrow_down
            </span>
          </div>
          {errors.governorate && <p className="text-xs text-red-500">{errors.governorate}</p>}
        </div>

        {/* City */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="city">
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="city"
              value={city}
              disabled={!governorate}
              onChange={(e) => {
                setCity(e.target.value);
                setErrors((er) => ({ ...er, city: "" }));
              }}
              className="w-full h-14 appearance-none bg-white border border-[#bdc9c8] rounded-xl px-4 pr-12 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all disabled:bg-[#f0eded] disabled:text-[#3e4949]/50 cursor-pointer"
            >
              <option value="" disabled>{governorate ? "Select a city" : "Select region first"}</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#3e4949]">
              keyboard_arrow_down
            </span>
          </div>
          {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
        </div>
      </div>

      {/* Street address */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="address">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          id="address"
          type="text"
          value={readableAddress}
          onChange={(e) => {
            setReadableAddress(e.target.value);
            setErrors((er) => ({ ...er, readableAddress: "" }));
          }}
          placeholder="Enter street name and building number"
          className="w-full h-14 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
        />
        {errors.readableAddress && <p className="text-xs text-red-500">{errors.readableAddress}</p>}
      </div>

      {/* Map Location Picker */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-[#1b1c1c]">Map Location Picker</label>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={loadingLoc}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#bdc9c8] text-xs font-bold text-gray-700 bg-white rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm leading-none">my_location</span>
            {loadingLoc ? "Detecting..." : "Detect Location"}
          </button>
        </div>
        <div className="relative w-full h-60 rounded-2xl overflow-hidden border border-[#bdc9c8] shadow-inner">
          <SharedMap center={leafletCenter} readOnly={false} zoom={13} onChange={handleMapChange} />
        </div>
        <p className="text-[10px] text-gray-400 font-semibold leading-normal">
          * Drag the map marker or click anywhere on the map to pinpoint your exact coordinates. Inputs will auto-fill.
        </p>
      </div>

      {/* Trust note */}
      <div className="flex items-center gap-2 text-[#3e4949]/70 text-xs">
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified_user</span>
        Your full address and map details are only shared with a caregiver after you accept their application.
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#bdc9c8]/30">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#1f8a8a] text-[#1f8a8a] font-bold rounded-xl hover:bg-[#1f8a8a]/5 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Scheduling
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#1f8a8a] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#0d8282] transition-all active:scale-95 min-h-[56px] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              Submit Request
              <span className="material-symbols-outlined">send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
