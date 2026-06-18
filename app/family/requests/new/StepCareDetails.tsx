"use client";

import { useState } from "react";
import { CareRequestFormData, ServiceType, Beneficiary } from "@/lib/types/care-request";
import { useFamilyElderlyProfiles } from "@/lib/hooks";

type Step1Data = Pick<CareRequestFormData, "beneficiaryId" | "serviceType" | "description" | "budgetPerHour">;

interface StepCareDetailsProps {
  defaultValues: Step1Data;
  onNext: (data: Step1Data) => void;
}

const SERVICE_TYPES: { value: ServiceType; label: string; icon: string }[] = [
  { value: "elderly_care", label: "Elderly Care", icon: "elderly" },
  { value: "companionship", label: "Companion Care", icon: "volunteer_activism" },
  { value: "home_nursing", label: "Home Nursing", icon: "medical_services" },
  { value: "physical_therapy", label: "Physical Therapy", icon: "accessible" },
  { value: "child_care", label: "Child Care", icon: "child_care" },
];

export default function StepCareDetails({ defaultValues, onNext }: StepCareDetailsProps) {
  const { data: profileData, isLoading: profilesLoading } = useFamilyElderlyProfiles();
  const beneficiaries: Beneficiary[] = profileData?.beneficiaries ?? [];

  const [beneficiaryId, setBeneficiaryId] = useState(defaultValues.beneficiaryId);
  const [serviceType, setServiceType] = useState<ServiceType>(defaultValues.serviceType);
  const [description, setDescription] = useState(defaultValues.description);
  const [budgetPerHour, setBudgetPerHour] = useState<number | "">(defaultValues.budgetPerHour);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!serviceType) errs.serviceType = "Please select a care type.";
    if (!description.trim()) errs.description = "Please describe the care needs.";
    if (budgetPerHour === "" || Number(budgetPerHour) < 1)
      errs.budgetPerHour = "Please enter a valid hourly budget (minimum 1).";
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext({ beneficiaryId, serviceType, description, budgetPerHour });
  };

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <h3 className="text-xl font-bold text-[#1f8a8a] mb-1">Recipient Information</h3>
        <p className="text-sm text-[#3e4949]">Select who needs care from your registered beneficiaries.</p>
      </div>

      {/* Beneficiary selector */}
      {profilesLoading ? (
        <div className="flex gap-3 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-12 w-32 bg-[#f0eded] rounded-xl" />)}
        </div>
      ) : beneficiaries.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#1b1c1c]">Select Beneficiary</label>
          <div className="flex flex-wrap gap-3">
            {beneficiaries.map((b) => (
              <button
                key={b._id}
                type="button"
                onClick={() => setBeneficiaryId(b._id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  beneficiaryId === b._id
                    ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                    : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {b.category === "elderly" ? "elderly" : "accessibility_new"}
                </span>
                <span>{b.name}</span>
                <span className="text-xs opacity-60">({b.age}y)</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <span className="material-symbols-outlined text-amber-600 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            info
          </span>
          <p className="text-sm text-amber-700">
            No beneficiaries found. Please add a family member in your{" "}
            <a href="/family/profile" className="font-bold underline">Profile</a>{" "}
            first, then return here.
          </p>
        </div>
      )}

      <div className="border-t border-[#bdc9c8]/30" />

      {/* Care specifics */}
      <div>
        <h3 className="text-xl font-bold text-[#1f8a8a] mb-1">Care Specifics</h3>
        <p className="text-sm text-[#3e4949]">Define the type of support needed.</p>
      </div>

      {/* Service type cards */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]">
          Care Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SERVICE_TYPES.map((ct) => {
            const isActive = serviceType === ct.value;
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => { setServiceType(ct.value); setErrors((e) => ({ ...e, serviceType: "" })); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  isActive
                    ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                    : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                }`}
              >
                <span className="material-symbols-outlined text-3xl">{ct.icon}</span>
                <span className="text-xs font-semibold">{ct.label}</span>
              </button>
            );
          })}
        </div>
        {errors.serviceType && <p className="text-xs text-red-500">{errors.serviceType}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="needs_desc">
          Description of Needs <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[#3e4949]/70">
          Include dietary restrictions, personality traits, daily routines, or specific tasks required.
        </p>
        <textarea
          id="needs_desc"
          rows={4}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors((er) => ({ ...er, description: "" })); }}
          placeholder="Describe the specific care needs in detail..."
          className="w-full bg-white border border-[#bdc9c8] rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      {/* Budget per hour */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="budget">
          Budget per Hour (SAR) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#3e4949] pointer-events-none">
            payments
          </span>
          <input
            id="budget"
            type="number"
            min={1}
            value={budgetPerHour}
            onChange={(e) => {
              setBudgetPerHour(e.target.value === "" ? "" : Number(e.target.value));
              setErrors((er) => ({ ...er, budgetPerHour: "" }));
            }}
            placeholder="e.g. 60"
            className="w-full h-14 bg-white border border-[#bdc9c8] rounded-xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
          />
        </div>
        {errors.budgetPerHour && <p className="text-xs text-red-500">{errors.budgetPerHour}</p>}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-[#aeedd5]/20 rounded-xl border border-[#aeedd5]">
        <span className="material-symbols-outlined text-[#2c6956] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
          info
        </span>
        <p className="text-xs text-[#316d5b]">
          Your request will be visible to verified caregivers matching your service type and location.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-[#bdc9c8]/30">
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-8 h-14 rounded-xl bg-[#1f8a8a] text-white font-bold text-sm hover:bg-[#0d8282] transition-all shadow-md active:scale-95"
        >
          Next
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
