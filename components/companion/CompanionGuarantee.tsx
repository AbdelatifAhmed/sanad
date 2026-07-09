import React from "react";
import { ShieldCheck } from "lucide-react";

export default function CompanionGuarantee() {
  return (
    <div className="bg-[#f4f3f0]/80 p-5 rounded-3xl border border-sand-high/60 shadow-sm flex gap-3.5 items-start">
      <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#005c53] flex items-center justify-center shrink-0 border border-teal-100/50">
        <ShieldCheck className="w-5 h-5 fill-[#005c53]/10" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-[#012d1d]">
          Sanad Guarantee
        </h4>
        <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
          This caregiver has passed comprehensive background checks and clinical skill verifications.
        </p>
      </div>
    </div>
  );
}
