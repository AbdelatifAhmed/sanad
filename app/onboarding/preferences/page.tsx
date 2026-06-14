"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sliders,
  Sparkles,
  Heart
} from "lucide-react";

const LANGUAGES = [
  { id: "arabic", label: "Arabic" },
  { id: "english", label: "English" },
  { id: "french", label: "French" },
  { id: "spanish", label: "Spanish" }
];

const SERVICES = [
  { id: "Companion Care", label: "Companion Care" },
  { id: "Mobility Support", label: "Mobility Support" },
  { id: "Light Housekeeping", label: "Light Housekeeping" },
  { id: "Meal Preparation", label: "Meal Preparation" },
  { id: "Medication Reminders", label: "Medication Reminders" },
  { id: "Dementia Care", label: "Dementia Care" }
];

export default function PreferencesPage() {
  const router = useRouter();

  // State
  const [hourlyRate, setHourlyRate] = useState("30");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["arabic", "english"]);
  const [selectedServices, setSelectedServices] = useState<string[]>(["Companion Care"]);
  const [bio, setBio] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load drafts from localStorage on mount
  useEffect(() => {
    const savedRate = localStorage.getItem("onboarding_rate");
    const savedLanguages = localStorage.getItem("onboarding_languages");
    const savedServices = localStorage.getItem("onboarding_services");
    const savedBio = localStorage.getItem("onboarding_bio");

    if (savedRate) setHourlyRate(savedRate);
    if (savedLanguages) {
      try {
        setSelectedLanguages(JSON.parse(savedLanguages));
      } catch (e) {}
    }
    if (savedServices) {
      try {
        setSelectedServices(JSON.parse(savedServices));
      } catch (e) {}
    }
    if (savedBio) setBio(savedBio);
  }, []);

  const handleLanguageToggle = (langId: string) => {
    setSelectedLanguages(prev =>
      prev.includes(langId)
        ? prev.filter(id => id !== langId)
        : [...prev, langId]
    );
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSaveAndExit = () => {
    localStorage.setItem("onboarding_rate", hourlyRate);
    localStorage.setItem("onboarding_languages", JSON.stringify(selectedLanguages));
    localStorage.setItem("onboarding_services", JSON.stringify(selectedServices));
    localStorage.setItem("onboarding_bio", bio);
    router.push("/login");
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hourlyRate || parseInt(hourlyRate) <= 0) {
      setErrorMsg("Please enter a valid hourly rate.");
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg("Please select at least one care service.");
      return;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      setErrorMsg("Please write a short bio (minimum 20 characters) about yourself.");
      return;
    }

    localStorage.setItem("onboarding_rate", hourlyRate);
    localStorage.setItem("onboarding_languages", JSON.stringify(selectedLanguages));
    localStorage.setItem("onboarding_services", JSON.stringify(selectedServices));
    localStorage.setItem("onboarding_bio", bio);

    router.push("/onboarding/review");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9f6] text-[#1c1c1a] font-body relative">
      {/* Top Header */}
      <header className="bg-white border-b border-sand-high sticky top-0 z-50 flex justify-between items-center px-6 md:px-16 py-4 w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Sanad Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
          <span className="font-display text-xl font-bold text-[#012d1d]">Sanad</span>
        </div>
        <div>
          <button
            onClick={handleSaveAndExit}
            className="text-gray-500 font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
          >
            Save &amp; Exit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 md:px-16 py-10">
        <div className="w-full">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-3/4 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" />
              
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500">Basic Info</span>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500">Qualifications</span>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500">Availability</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-primary-container/10">
                  4
                </div>
                <span className="text-[10px] md:text-xs font-bold text-primary">Preferences</span>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400">Review</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl border border-sand-high p-8 md:p-10 custom-shadow space-y-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">
                Match Preferences
              </h1>
              <p className="text-gray-500 text-sm md:text-base font-medium">
                Set up your rates and specify the type of companionship care services you specialize in.
              </p>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs font-semibold bg-red-50 p-3 rounded-lg border border-red-200 text-left">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleNext} className="space-y-8 text-left">
              {/* Rate & Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hourly Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 block">Desired Hourly Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={hourlyRate}
                      onChange={(e) => {
                        setHourlyRate(e.target.value);
                        setErrorMsg("");
                      }}
                      className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700 text-sm font-semibold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                      $ / Hour
                    </span>
                  </div>
                </div>

                {/* Preferred Languages */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 block">Languages You Speak</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {LANGUAGES.map(lang => {
                      const isSelected = selectedLanguages.includes(lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => handleLanguageToggle(lang.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? "bg-primary/5 border-primary text-primary"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Care Services & Skills */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 block">Services You Can Offer</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICES.map(service => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceToggle(service.id)}
                        className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/5 border-primary text-primary font-bold"
                            : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-white"
                        }`}
                      >
                        <span className="text-xs font-bold">{service.label}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? "bg-primary border-primary text-white" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Heart className="w-2.5 h-2.5 fill-current" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio details */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1c1c1a] block">About Me / Personal Bio</label>
                <textarea
                  rows={4}
                  placeholder="Introduce yourself to families! Discuss your style of care, hobbies, and why you love being a companion."
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setErrorMsg("");
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700 text-sm font-medium leading-relaxed resize-none"
                />
                <span className="text-[10px] text-gray-400 font-semibold block text-right">
                  Minimum 20 characters
                </span>
              </div>

              {/* Tips for match */}
              <div className="p-4 bg-teal-50/20 rounded-xl flex items-start gap-3 border border-teal-50">
                <Sparkles className="w-5 h-5 text-[#2c6956] shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Caregivers with detailed bios and hourly rates that match their local market standards get booked 3x faster.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex justify-between items-center border-t border-sand-high">
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/availability")}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-sand-high w-full mt-12 py-8 px-6 md:px-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-display text-lg font-bold text-primary">Sanad</span>
          <p className="text-xs text-gray-400 font-medium">
            &copy; 2026 Sanad. All rights reserved. Providing compassionate support.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-xs font-medium text-gray-400 hover:text-primary transition-colors underline">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs font-medium text-gray-400 hover:text-primary transition-colors underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
