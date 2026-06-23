"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, DollarSign, Briefcase, FileText } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";

const professionalInfoSchema = z.object({
  companionType: z.enum(["general", "specialized"]),
  specialization: z.enum(["none", "nursing", "physiotherapy", "companionship_companion"]),
  bio: z.string().min(20, "Please provide a bio with at least 20 characters"),
  hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
});

type ProfessionalInfoData = z.infer<typeof professionalInfoSchema>;

export default function CompanionProfessionalInfo() {
  const { companionData, updateCompanionData, nextStep, prevStep } = useRegisterStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfessionalInfoData>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      companionType: companionData.companionType,
      specialization: companionData.specialization,
      bio: companionData.bio,
      hourlyRate: companionData.hourlyRate,
    },
  });

  const companionType = watch("companionType");

  const onSubmit = (data: ProfessionalInfoData) => {
    updateCompanionData(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        {/* Companion Type */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">I am a:</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setValue("companionType", "general");
                setValue("specialization", "none");
              }}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                companionType === "general"
                  ? "border-button bg-button/5 text-button"
                  : "border-outline-variant bg-white text-gray-500 hover:border-gray-400"
              }`}
            >
              <span className="text-sm font-bold block">General Caregiver</span>
              <span className="text-[10px] text-gray-400 font-semibold">Non-medical support</span>
            </button>

            <button
              type="button"
              onClick={() => setValue("companionType", "specialized")}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                companionType === "specialized"
                  ? "border-button bg-button/5 text-button"
                  : "border-outline-variant bg-white text-gray-500 hover:border-gray-400"
              }`}
            >
              <span className="text-sm font-bold block">Specialized Care</span>
              <span className="text-[10px] text-gray-400 font-semibold">Medical/Therapy support</span>
            </button>
          </div>
          {errors.companionType && <p className="text-red-500 text-xs font-semibold">{errors.companionType.message}</p>}
        </div>

        {/* Specialization (if specialized) */}
        {companionType === "specialized" && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="block text-sm font-bold text-gray-700">Specialization</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                {...register("specialization")}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium appearance-none"
              >
                <option value="none">Select specialization</option>
                <option value="nursing">Nursing</option>
                <option value="physiotherapy">Physiotherapy</option>
                <option value="companionship_companion">Companionship Companion</option>
              </select>
            </div>
            {errors.specialization && <p className="text-red-500 text-xs font-semibold">{errors.specialization.message}</p>}
          </div>
        )}

        {/* Hourly Rate */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Hourly Rate ($)</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("hourlyRate", { valueAsNumber: true })}
              type="number"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="e.g. 150"
            />
          </div>
          {errors.hourlyRate && <p className="text-red-500 text-xs font-semibold">{errors.hourlyRate.message}</p>}
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Bio / About You</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            <textarea
              {...register("bio")}
              rows={4}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm leading-relaxed resize-none"
              placeholder="Share your experience, passion for care, and what makes you a great companion..."
            />
          </div>
          {errors.bio && <p className="text-red-500 text-xs font-semibold">{errors.bio.message}</p>}
        </div>
      </div>

      <div className="pt-6 flex justify-between items-center border-t border-sand-high">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          Next Step
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </form>
  );
}
