"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Search, Filter } from "lucide-react";

export default function FamilyCompanions() {
  return (
    <div className="min-h-screen bg-[#fcf9f6] text-[#1c1c1a] font-body flex flex-col animate-fade-in">
      <header className="bg-white border-b border-sand-high sticky top-0 z-50 flex justify-between items-center px-6 md:px-16 py-4 w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Sanad Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
          <span className="font-display text-xl font-bold text-[#012d1d]">Sanad</span>
        </div>
        <Link
          href="/family/dashboard"
          className="flex items-center gap-1.5 text-gray-500 font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 md:px-16 py-10 space-y-8 text-left">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Find Companions</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Browse and connect with top-rated caregiver companions.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-sand-high custom-shadow space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search by name, skills or city..."
                className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700 text-xs font-semibold"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button className="flex items-center justify-center gap-1.5 px-6 h-12 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl font-bold text-xs transition-all cursor-pointer">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="p-8 text-center text-gray-400 font-medium text-xs">
            No companion match recommendations are available right now. Please complete verification or update filters.
          </div>
        </div>
      </main>
    </div>
  );
}
