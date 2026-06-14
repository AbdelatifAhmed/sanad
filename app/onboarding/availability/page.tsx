"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Sun,
  CloudSun,
  Moon,
  Info
} from "lucide-react";

// Days matching database validation
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const SLOTS = [
  { id: "Morning", label: "Morning", time: "6am - 12pm", icon: Sun },
  { id: "Afternoon", label: "Afternoon", time: "12pm - 6pm", icon: CloudSun },
  { id: "Evening", label: "Evening", time: "6pm - 12am", icon: Moon }
];

export default function AvailabilityPage() {
  const router = useRouter();

  // State for availability selection: { [day]: { [slot]: boolean } }
  const [availability, setAvailability] = useState<{ [key: string]: { [key: string]: boolean } }>({
    Monday: { Morning: true, Afternoon: true, Evening: false },
    Tuesday: { Morning: true, Afternoon: true, Evening: false },
    Wednesday: { Morning: true, Afternoon: false, Evening: false },
    Thursday: { Morning: false, Afternoon: true, Evening: false },
    Friday: { Morning: true, Afternoon: true, Evening: true },
    Saturday: { Morning: false, Afternoon: false, Evening: true },
    Sunday: { Morning: false, Afternoon: false, Evening: true }
  });

  const [activeMobileDay, setActiveMobileDay] = useState("Monday");
  const [emergencyCare, setEmergencyCare] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAvailability = localStorage.getItem("onboarding_availability");
    const savedEmergency = localStorage.getItem("onboarding_emergency");

    if (savedAvailability) {
      try {
        const parsed: { day: string; slots: string[] }[] = JSON.parse(savedAvailability);
        const newState: typeof availability = {};
        DAYS.forEach(day => {
          newState[day] = { Morning: false, Afternoon: false, Evening: false };
        });
        parsed.forEach(item => {
          if (newState[item.day]) {
            item.slots.forEach(slot => {
              newState[item.day][slot] = true;
            });
          }
        });
        setAvailability(newState);
      } catch (e) {
        console.error("Error parsing saved availability", e);
      }
    }

    if (savedEmergency !== null) {
      setEmergencyCare(savedEmergency === "true");
    }
  }, []);

  // Toggle slot state
  const toggleSlot = (day: string, slotId: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slotId]: !prev[day]?.[slotId]
      }
    }));
  };

  const handleClearAll = () => {
    const cleared: typeof availability = {};
    DAYS.forEach(day => {
      cleared[day] = { Morning: false, Afternoon: false, Evening: false };
    });
    setAvailability(cleared);
  };

  const handleSaveAndExit = () => {
    const formattedAvailability = DAYS.map(day => {
      const slotsForDay = Object.keys(availability[day] || {}).filter(
        slotId => availability[day][slotId]
      );
      return { day, slots: slotsForDay };
    });

    localStorage.setItem("onboarding_availability", JSON.stringify(formattedAvailability));
    localStorage.setItem("onboarding_emergency", String(emergencyCare));
    router.push("/login");
  };

  const handleNext = () => {
    // Transform availability state to format backend expects
    const formattedAvailability = DAYS.map(day => {
      const slotsForDay = Object.keys(availability[day] || {}).filter(
        slotId => availability[day][slotId]
      );
      return {
        day,
        slots: slotsForDay
      };
    });

    localStorage.setItem("onboarding_availability", JSON.stringify(formattedAvailability));
    localStorage.setItem("onboarding_emergency", String(emergencyCare));

    router.push("/onboarding/preferences");
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
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 md:px-16 py-10">
        {/* Progress Header */}
        <div className="mb-10">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-1/2 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" />
              
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
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-primary-container/10">
                  3
                </div>
                <span className="text-[10px] md:text-xs font-bold text-primary">Availability</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400">Preferences</span>
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

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-primary mt-1">
                Set Your Availability
              </h1>
            </div>
            <p className="text-gray-500 text-sm font-medium mt-1 md:mt-0">
              Step 3 of 5: Helping us match you with families
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Instructions & Emergency Switch */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-sand-high custom-shadow space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-primary mb-2">Scheduling Details</h2>
                <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed">
                  Select the time blocks you are generally available each week. You can adjust specific dates later in your dashboard.
                </p>
              </div>

              <hr className="border-sand-high" />

              {/* Emergency Care Toggle */}
              <div className="flex items-center justify-between p-4 bg-teal-50/50 rounded-2xl border border-teal-50">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-[#2c6956] flex items-center gap-1">
                    Emergency Care
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold mt-0.5">Available for last-minute needs</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmergencyCare(!emergencyCare)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    emergencyCare ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      emergencyCare ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Tips */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Families prefer caregivers with consistent morning and afternoon blocks.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Set a generic weekly pattern. You can refine this at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Helper Illustration card */}
            <div className="hidden lg:block relative overflow-hidden h-60 rounded-3xl custom-shadow border border-sand-high">
              <img
                alt="Availability visual"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWUzvFsrJ8j7CSK4LdMIcsVQMubEXi3lzMdGFPmqWun2Id6sm3Rtg_RVc0vEmIBJr9_g5Qkg0aTZvd-rS8TmmbkiBC27e2V_St8mce-pdYN85_6rYSTqfhYSRtIJCuplihgBm90-VzlhtAUjJhCz13qwbOnqQgcHg6YKUWvrkee2QhYGx0QX4ATYTYbsIFvuwy61XTOPuk-s1SztBkS_D5xA5X9W8qGZ5BPea018n8ZVbtD4oWa1OTEsEC2arSnqo-ffpXpfjSLEWz"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#012d1d]/85 via-[#012d1d]/30 to-transparent flex items-end p-5">
                <p className="text-white text-xs font-bold leading-relaxed">
                  Over 85% of our caregivers find their first family within 48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Schedule Matrix */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-sand-high custom-shadow overflow-hidden">
              
              {/* Weekday Selector (Mobile only tab) */}
              <div className="flex md:hidden overflow-x-auto p-3 gap-2 border-b border-sand-high bg-gray-50/50">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setActiveMobileDay(day)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      activeMobileDay === day
                        ? "bg-primary text-white"
                        : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>

              {/* Desktop view Grid */}
              <div className="p-6 md:p-8 overflow-x-auto">
                {/* Desktop view table */}
                <table className="w-full border-collapse min-w-[550px] hidden md:table">
                  <thead>
                    <tr>
                      <th className="p-2 text-left"></th>
                      {DAYS.map(day => (
                        <th key={day} className="p-2 text-center text-xs font-bold text-gray-500">
                          {day.substring(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {SLOTS.map(slot => (
                      <tr key={slot.id}>
                        <td className="py-4 pr-4 text-left">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{slot.label}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{slot.time}</span>
                          </div>
                        </td>
                        {DAYS.map(day => {
                          const isActive = availability[day]?.[slot.id];
                          const IconComp = slot.icon;
                          return (
                            <td key={day} className="p-1.5">
                              <button
                                type="button"
                                onClick={() => toggleSlot(day, slot.id)}
                                className={`w-full h-14 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                                  isActive
                                    ? "bg-primary text-white border-primary shadow-sm hover:opacity-90"
                                    : "bg-gray-50 border-gray-200 text-gray-400 hover:border-primary/40 hover:bg-white"
                                }`}
                              >
                                <IconComp className="w-5 h-5 shrink-0" />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile view block */}
                <div className="block md:hidden space-y-4 text-left py-2">
                  <h3 className="text-sm font-bold text-gray-800 px-1">
                    Availability for {activeMobileDay}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {SLOTS.map(slot => {
                      const isActive = availability[activeMobileDay]?.[slot.id];
                      const IconComp = slot.icon;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleSlot(activeMobileDay, slot.id)}
                          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all text-left cursor-pointer ${
                            isActive
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComp className="w-5 h-5 shrink-0" />
                            <div>
                              <p className="text-sm font-bold">{slot.label}</p>
                              <p className={`text-[10px] font-semibold ${isActive ? "text-white/85" : "text-gray-400"}`}>
                                {slot.time}
                              </p>
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-gray-50/50 p-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/qualifications")}
                  className="w-full md:w-auto flex items-center justify-center gap-1 text-gray-500 font-bold text-sm px-4 py-2 hover:text-primary transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="w-full md:w-auto px-6 py-3 font-bold text-xs bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="group w-full md:w-60 h-12 flex items-center justify-center gap-2 bg-primary text-white font-bold text-sm rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-sand-high w-full mt-12 py-8 px-6 md:px-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
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
