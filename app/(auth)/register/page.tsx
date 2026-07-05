"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Headphones } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";

// Steps
import BasicInfoStep from "@/components/auth/BasicInfoStep";
import CompanionDocuments from "@/components/auth/CompanionDocuments";
import CompanionProfessionalInfo from "@/components/auth/CompanionProfessionalInfo";
import FamilyAddressDetails from "@/components/auth/FamilyAddressDetails";
import FamilyBeneficiaryInfo from "@/components/auth/FamilyBeneficiaryInfo";
import LocationStep from "@/components/auth/LocationStep";
import ReviewStep from "@/components/auth/ReviewStep";

export default function RegisterPage() {
  const step = useRegisterStore((state) => state.step);
  const role = useRegisterStore((state) => state.role);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const StepComponent = useMemo(() => {
    if (!mounted) return null;
    switch (step) {
      case 1:
        return <RoleSelectionStep />;
      case 2:
        return <BasicInfoStep />;
      case 3:
        return <LocationStep />;
      case 4:
        return role === "companion" ? (
          <CompanionProfessionalInfo />
        ) : (
          <FamilyBeneficiaryInfo />
        );
      case 5:
        return role === "companion" ? (
          <CompanionDocuments />
        ) : (
          <FamilyAddressDetails />
        );
      case 6:
        return <ReviewStep />;
      default:
        return <RoleSelectionStep />;
    }
  }, [step, role, mounted]);

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Create an account";
      case 2:
        return "Basic Information";
      case 3:
        return "Your Location";
      case 4:
        return role === "companion"
          ? "Professional Info"
          : "Beneficiary Details";
      case 5:
        return role === "companion"
          ? "Verification Documents"
          : "Address Details";
      case 6:
        return "Review & Submit";
      default:
        return "Registration";
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="relative min-h-screen flex flex-col md:flex-row font-body bg-sand"
      dir="ltr"
    >
      {/* Left Side: Branding / Hero */}
      <section className="relative w-full md:w-[40%] min-h-75 md:min-h-screen flex flex-col justify-between p-8 md:p-10 overflow-hidden shrink-0">
        <div className="absolute inset-0 z-0">
          <Image
            src={
              role === "companion"
                ? "/hero-companion.png"
                : "/hero-family.png"
            }
            alt="Registration hero"
            fill
            priority
            className="object-cover transition-all duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-linear-to-t from-sand via-sand/45 to-sand/10" />
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
        </div>

        <div className="z-10 relative">
          <Image
            src="/logo.png"
            alt="Sanad Logo"
            width={100}
            height={40}
            className="h-16 md:h-20 object-contain select-none pointer-events-none mix-blend-multiply"
          />
        </div>

        <div className="z-10 relative max-w-xl space-y-4 mt-auto">
          <h1 className="font-display text-2.5xl md:text-3.5xl lg:text-4xl font-bold text-primary leading-[1.2] tracking-tight">
            {role === "companion"
              ? "Join our network of professional caregivers."
              : "Dignified care, closer to home."}
          </h1>
          <p className="text-gray-700 text-sm md:text-base font-medium leading-relaxed">
            {role === "companion"
              ? "Make a meaningful difference in the lives of elderly individuals and their families."
              : "Connecting families with compassionate, reliable caregivers for the elderly."}
          </p>
        </div>
      </section>

      {/* Right Side: Form */}
      <section className="w-full md:w-[60%] flex items-center justify-center py-16 px-6 md:px-16 overflow-y-auto bg-white/50 backdrop-blur-sm">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-3xl border border-sand-high p-8 md:p-10 custom-shadow space-y-8 animate-fade-in">
            {/* Stepper indicator */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                Step {step} of 6
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-gray-100"}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <h2 className="font-display text-2xl md:text-2.5xl font-bold text-primary mb-1">
                {getStepTitle()}
              </h2>
              <p className="text-gray-500 text-sm font-medium">
                Please follow the steps to complete your profile.
              </p>
            </div>

            {StepComponent}

            {step === 1 && (
              <p className="text-center text-sm text-gray-500 pt-2 font-medium">
                <span className="mr-1">Already have an account?</span>
                <Link
                  href="/login"
                  className="text-button font-bold hover:underline decoration-2 underline-offset-4"
                >
                  Log in
                </Link>
              </p>
            )}

            {role === "companion" && step === 1 && (
              <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-stitch-on-secondary-container flex items-center justify-center text-[#2c6956] shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800">Need help?</p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Contact our recruitment team at support@sanad.care
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function RoleSelectionStep() {
  const role = useRegisterStore((state) => state.role);
  const setRole = useRegisterStore((state) => state.setRole);
  const nextStep = useRegisterStore((state) => state.nextStep);

  const handleSelectRole = (newRole: "family" | "companion") => {
    setRole(newRole);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 text-left">
          I am registering as a:
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSelectRole("family")}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              role === "family"
                ? "border-button bg-button/5 text-button"
                : "border-outline-variant bg-white text-gray-500 hover:border-gray-400"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${role === "family" ? "bg-button/10 text-button" : "bg-gray-100 text-gray-400"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <span className="text-sm font-bold block">Family User</span>
            <span className="text-[11px] text-gray-400 font-semibold">
              Looking for care
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole("companion")}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              role === "companion"
                ? "border-button bg-button/5 text-button"
                : "border-outline-variant bg-white text-gray-500 hover:border-gray-400"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${role === "companion" ? "bg-button/10 text-button" : "bg-gray-100 text-gray-400"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h14"
                />
              </svg>
            </div>
            <span className="text-sm font-bold block">Caregiver</span>
            <span className="text-[11px] text-gray-400 font-semibold">
              Providing care
            </span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={nextStep}
        disabled={!role}
        className="w-full bg-button text-white py-3.5 px-8 rounded-xl font-bold text-base hover:bg-button-hover transition-all active:scale-[0.99] shadow-md shadow-button/20 flex items-center justify-center gap-2 mt-8 disabled:opacity-50 cursor-pointer"
      >
        <span>Continue Registration</span>
      </button>
    </div>
  );
}
