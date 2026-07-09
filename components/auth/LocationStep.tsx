"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import LocationPicker from "./LocationPicker";

export default function LocationStep() {
  const { location, nextStep, prevStep } = useRegisterStore();

  return (
    <div className="space-y-4">
      <LocationPicker />

      <div className="pt-3 flex justify-between items-center border-t border-sand-high">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={!location}
          className="group flex items-center justify-center gap-1.5 px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          Next Step
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
