"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Save } from "lucide-react";

export default function CompanionSchedule() {
  return (
    <div className="min-h-screen bg-[#fcf9f6] text-[#1c1c1a] font-body flex flex-col animate-fade-in">
      <header className="bg-white border-b border-sand-high sticky top-0 z-50 flex justify-between items-center px-6 md:px-16 py-4 w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Sanad Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
          <span className="font-display text-xl font-bold text-[#012d1d]">Sanad</span>
        </div>
        <Link
          href="/companion/dashboard"
          className="flex items-center gap-1.5 text-gray-500 font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 md:px-16 py-10 space-y-8 text-left">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Manage Schedule</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Specify your weekly calendar availability and set specific exception dates.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-sand-high custom-shadow space-y-6">
          <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2 border-b border-sand-high pb-3">
            <Calendar className="w-5 h-5" />
            Weekly Duty Calendar
          </h3>
          <p className="text-gray-500 text-xs font-semibold leading-relaxed">
            Your calendar settings are currently synchronizing with the server. You will be able to edit specific availability blocks once your account credentials pass validation.
          </p>
          <div className="pt-4 border-t border-sand-high flex justify-end">
            <button className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-95 transition-all shadow-md cursor-not-allowed opacity-55">
              <Save className="w-4 h-4" />
              Save Availability
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
