"use client";

import React from "react";
import Link from "next/link";
import { LogOut, Search, Clock, Home, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FamilyDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#fcf9f6] text-[#1c1c1a] font-body flex flex-col animate-fade-in">
      <header className="bg-white border-b border-sand-high sticky top-0 z-50 flex justify-between items-center px-6 md:px-16 py-4 w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Sanad Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
          <span className="font-display text-xl font-bold text-[#012d1d]">Sanad</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-500 font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 md:px-16 py-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Family Dashboard</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Find and match with qualified companion caregivers in your area.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/family/companions"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-95 transition-all shadow-md"
            >
              <Search className="w-4 h-4" />
              Find Companions
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-sand-high custom-shadow space-y-4 text-left">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-primary">Beneficiary Profile</h3>
            <p className="text-gray-500 text-xs font-semibold leading-relaxed">
              Your elder/special needs beneficiary details have been registered. Keep medical needs and hobbies updated for better matchups.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-sand-high custom-shadow space-y-4 text-left">
            <div className="w-12 h-12 bg-[#fdf2e9] rounded-2xl flex items-center justify-center text-[#d97706]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-primary">Pending Requests</h3>
            <p className="text-gray-500 text-xs font-semibold leading-relaxed">
              Any booking requests sent to caregivers or active care contracts will be listed in this panel.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-sand-high custom-shadow space-y-4 text-left">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-primary">Care Settings</h3>
            <p className="text-gray-500 text-xs font-semibold leading-relaxed">
              Manage residence details, preferred language requirements, and payment cards for automatic care billing.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
