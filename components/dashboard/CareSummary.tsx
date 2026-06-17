import React from "react";
import Link from "next/link";
import { MoreVertical, Activity, Pill } from "lucide-react";

interface CareSummaryData {
  vitals?: {
    bp: string;
    pulse: string;
    recordedBy: string;
    recordedAt: string;
  };
  medicationNote?: {
    text: string;
  };
}

interface CareSummaryProps {
  careSummary?: CareSummaryData;
}

export default function CareSummary({ careSummary }: CareSummaryProps) {
  const vitals = careSummary?.vitals || {
    bp: "120/80",
    pulse: "72 bpm",
    recordedBy: "Fatima",
    recordedAt: "yesterday"
  };
  const medicationNote = careSummary?.medicationNote || {
    text: "Prescription refill needed by Friday for Lisinopril."
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-high shadow-soft flex flex-col gap-6 sticky top-24 transition-all duration-300 hover:shadow-md">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-sand-high/40">
        <h3 className="font-display text-lg font-bold text-[#012d1d]">
          Care Summary
        </h3>
        <button className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-50">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Latest Vitals Card */}
      {vitals && (
        <div className="border border-sand-high/60 bg-[#fdfcfa]/50 rounded-2xl p-4.5 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
              <Activity className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Latest Vitals
            </h4>
          </div>
          <p className="text-[11px] text-gray-400 font-semibold">
            Recorded {vitals.recordedAt} by {vitals.recordedBy}.
          </p>
          
          {/* Vitals Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-sand-high/80 rounded-xl p-3 text-center shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                BP
              </span>
              <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                {vitals.bp}
              </span>
            </div>
            <div className="bg-white border border-sand-high/80 rounded-xl p-3 text-center shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                PULSE
              </span>
              <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                {vitals.pulse}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Medication Note Card */}
      {medicationNote && (
        <div className="border border-sand-high/60 bg-[#fdfcfa]/50 rounded-2xl p-4.5 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fff8e1] text-[#ffb300] flex items-center justify-center shrink-0 border border-[#ffe082]/40">
              <Pill className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Medication Note
            </h4>
          </div>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            {medicationNote.text}
          </p>
        </div>
      )}

      {/* View Full Chart Button */}
      <Link 
        href="/family/schedule" 
        className="w-full text-center py-3 border border-sand-high hover:border-primary/20 hover:bg-gray-50/50 rounded-2xl text-xs font-bold text-gray-700 hover:text-primary transition-all duration-200 block cursor-pointer active:scale-[0.98]"
      >
        View Full Chart
      </Link>
    </div>
  );
}
