"use client";

import { useState } from "react";
import { CareRequestFormData } from "@/lib/types/care-request";

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
  const [notes, setNotes] = useState(loc.notes);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableCities = governorate ? (CITIES_BY_REGION[governorate] ?? []) : [];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!governorate) errs.governorate = "Please select a region/governorate.";
    if (!city) errs.city = "Please select a city.";
    if (!readableAddress.trim()) errs.readableAddress = "Street address is required.";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ locationData: { city, governorate, readableAddress, notes } });
  };

  return (
    <div className="space-y-8">
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
              className="w-full h-14 appearance-none bg-white border border-[#bdc9c8] rounded-xl px-4 pr-12 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
            >
              <option value="" disabled>Select a region</option>
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
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
              onChange={(e) => { setCity(e.target.value); setErrors((er) => ({ ...er, city: "" })); }}
              className="w-full h-14 appearance-none bg-white border border-[#bdc9c8] rounded-xl px-4 pr-12 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all disabled:bg-[#f0eded] disabled:text-[#3e4949]/50"
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
          onChange={(e) => { setReadableAddress(e.target.value); setErrors((er) => ({ ...er, readableAddress: "" })); }}
          placeholder="Enter street name and building number"
          className="w-full h-14 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
        />
        {errors.readableAddress && <p className="text-xs text-red-500">{errors.readableAddress}</p>}
      </div>

      {/* Map placeholder */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]">Approximate Location</label>
        <div className="relative w-full h-56 rounded-xl overflow-hidden border border-[#bdc9c8] group">
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
            <div className="bg-white p-3 rounded-full shadow-lg border-2 border-[#1f8a8a]">
              <span
                className="material-symbols-outlined text-[#1f8a8a]"
                style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
            </div>
          </div>
          {city && (
            <div className="absolute top-3 right-3 bg-[#1f8a8a] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              {city}
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[#bdc9c8] flex items-center gap-2 shadow-sm text-xs font-semibold text-[#1b1c1c]">
            <span className="material-symbols-outlined text-[#1f8a8a]" style={{ fontSize: "14px" }}>info</span>
            Exact pin will be shared only after hiring
          </div>
        </div>
      </div>

      {/* Additional notes */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="notes">
          Additional Instructions{" "}
          <span className="text-[#3e4949]/60 font-normal">(Optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gate code, landmarks, or specific entrance instructions..."
          className="w-full bg-white border border-[#bdc9c8] rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
        />
      </div>

      {/* Trust note */}
      <div className="flex items-center gap-2 text-[#3e4949]/70 text-xs">
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified_user</span>
        Your full address is only shared with a caregiver after you accept their application.
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
