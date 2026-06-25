"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, User, MapPin, Briefcase, FileText } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useAuthStore } from "@/store/authStore";
import { registerUser } from "@/lib/API";

export default function ReviewStep() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const state = useRegisterStore();
  const setAuth = useAuthStore((s: any) => s.setAuth);

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      name: state.name,
      email: state.email,
      password: state.password,
      phone: state.phone,
      role: state.role,
      location: state.location,
      companionData: state.role === 'companion' ? state.companionData : undefined,
      familyData: state.role === 'family' ? state.familyData : undefined,
    };

    try {
      const data = await registerUser(payload);
      const { accessToken, user } = data;
      
      // Save to auth store
      setAuth(user, accessToken);
      
      // Cleanup register store
      state.resetRegisterForm();
      
      // Redirect based on role
      const dashboardPath = state.role === 'companion' ? '/companion/dashboard' : '/family/dashboard';
      router.replace(dashboardPath);
    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary">Review & Submit</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Please review your information before completing the registration.
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Info Summary */}
        <div className="p-4 bg-white border border-sand-high rounded-2xl space-y-3 custom-shadow">
          <div className="flex items-center gap-2 text-primary">
            <User className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Account Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Name</p>
              <p className="text-sm font-medium text-gray-700">{state.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
              <p className="text-sm font-medium text-gray-700">{state.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
              <p className="text-sm font-medium text-gray-700">{state.email}</p>
            </div>
          </div>
        </div>

        {/* Location Summary */}
        <div className="p-4 bg-white border border-sand-high rounded-2xl space-y-3 custom-shadow">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Location</h3>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Address</p>
            <p className="text-sm font-medium text-gray-700 leading-relaxed">{state.location?.readableAddress}</p>
          </div>
        </div>

        {/* Role Specific Summary */}
        {state.role === 'companion' ? (
          <div className="p-4 bg-white border border-sand-high rounded-2xl space-y-3 custom-shadow">
            <div className="flex items-center gap-2 text-primary">
              <Briefcase className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Professional Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Type</p>
                <p className="text-sm font-medium text-gray-700 capitalize">{state.companionData.companionType}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Rate</p>
                <p className="text-sm font-medium text-gray-700">${state.companionData.hourlyRate}/hr</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border border-sand-high rounded-2xl space-y-3 custom-shadow">
            <div className="flex items-center gap-2 text-primary">
              <HeartHandshake className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Family Needs</h3>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Beneficiaries</p>
              <p className="text-sm font-medium text-gray-700">
                {state.familyData.beneficiaries.length} person(s) registered
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="pt-6 flex justify-between items-center border-t border-sand-high">
        <button
          type="button"
          onClick={state.prevStep}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={loading}
          className="group flex items-center justify-center gap-1.5 px-10 py-4 bg-primary text-white rounded-xl font-bold text-base shadow-lg hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {loading ? "Registering..." : "Complete Registration"}
        </button>
      </div>
    </div>
  );
}

const HeartHandshake = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
