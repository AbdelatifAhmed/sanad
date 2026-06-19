import React from "react";
import { Calendar, MessageSquare, Languages, Car } from "lucide-react";

interface CompanionBookingCardProps {
  hourlyRate: number;
  languages: string;
  transportation: string;
  name: string;
}

export default function CompanionBookingCard({
  hourlyRate,
  languages,
  transportation,
  name,
}: CompanionBookingCardProps) {
  // Extract first name for the message button, e.g. "Amina" from "Amina Al-Farsi"
  const firstName = name.split(" ")[0];

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft flex flex-col gap-6">
      {/* Price Heading */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
          Starting from
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-[#005c53]">
            AED {hourlyRate}
          </span>
          <span className="text-xs text-gray-500 font-bold">
            / hr
          </span>
        </div>
      </div>

      <hr className="border-sand-high/40" />

      {/* Action Buttons */}
      <div className="space-y-3">
        <button className="w-full bg-[#005c53] hover:bg-[#00473c] text-white py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-soft hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
          <Calendar className="w-4.5 h-4.5" />
          Request Care
        </button>
        <button className="w-full bg-[#f4f3f0] hover:bg-gray-100 text-gray-800 py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
          <MessageSquare className="w-4.5 h-4.5 text-gray-600" />
          Message {firstName}
        </button>
      </div>

      <hr className="border-sand-high/40" />

      {/* Additional Details Grid - Circular Icon Wrappers */}
      <div className="space-y-4 text-xs font-semibold text-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#f2f7f6] text-[#005c53] flex items-center justify-center shrink-0 border border-[#e2f0ed]">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wide">Languages</span>
            <p className="mt-0.5 text-gray-800">{languages}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#f2f7f6] text-[#005c53] flex items-center justify-center shrink-0 border border-[#e2f0ed]">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wide">Transportation</span>
            <p className="mt-0.5 text-gray-800">{transportation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
