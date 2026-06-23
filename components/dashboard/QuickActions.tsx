import React from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Create Care Request Card */}
      <Link 
        href="/family/requests/new" 
        className="group relative bg-[#015347] hover:bg-[#00473c] p-6 rounded-3xl shadow-soft transition-all duration-300 transform hover:translate-y-[-2px] flex items-center gap-5 text-white overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="space-y-0.5">
          <h3 className="font-body font-bold text-lg leading-snug">
            Create Care Request
          </h3>
          <p className="text-white/80 text-xs font-medium">
            Schedule temporary or ongoing support.
          </p>
        </div>
      </Link>

      {/* Browse Caregivers Card */}
      <Link 
        href="/family/companions" 
        className="group relative bg-white hover:bg-gray-50/50 p-6 rounded-3xl border border-sand-high shadow-soft transition-all duration-300 transform hover:translate-y-[-2px] flex items-center gap-5 text-[#1c1c1a] cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-sand-high group-hover:scale-110 transition-transform duration-300">
          <Search className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="space-y-0.5">
          <h3 className="font-body font-bold text-lg leading-snug text-[#012d1d]">
            Browse Caregivers
          </h3>
          <p className="text-gray-500 text-xs font-medium">
            Find highly qualified healthcare professionals.
          </p>
        </div>
      </Link>
    </div>
  );
}
