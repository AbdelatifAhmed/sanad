"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, DollarSign, Briefcase, FileText } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useLocale } from "next-intl";

export default function CompanionProfessionalInfo() {
  const { companionData, updateCompanionData, nextStep, prevStep } = useRegisterStore();
  const locale = useLocale();
  const isAr = locale === "ar";

  const professionalInfoSchema = useMemo(() => z.object({
    companionType: z.enum(["general", "specialized"]),
    specialization: z.enum(["none", "nursing", "physiotherapy", "companionship_companion"]),
    bio: z.string().min(20, isAr ? "يرجى كتابة سيرة ذاتية لا تقل عن 20 حرفاً" : "Please provide a bio with at least 20 characters"),
    hourlyRate: z.coerce.number().min(1, isAr ? "يجب أن يكون سعر الساعة 1 على الأقل" : "Hourly rate must be at least 1"),
  }), [isAr]);

  type ProfessionalInfoData = z.infer<typeof professionalInfoSchema>;

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

  const labels = {
    typeLabel: isAr ? "أنا:" : "I am a:",
    generalTitle: isAr ? "مرافق رعاية عام" : "General Caregiver",
    generalDesc: isAr ? "دعم غير طبي وزيارات رفقة" : "Non-medical support",
    specialTitle: isAr ? "رعاية تخصصية" : "Specialized Care",
    specialDesc: isAr ? "دعم طبي أو علاج طبيعي" : "Medical/Therapy support",
    specialization: isAr ? "التخصص" : "Specialization",
    selectSpecialization: isAr ? "اختر التخصص" : "Select specialization",
    specNursing: isAr ? "تمريض" : "Nursing",
    specPhysio: isAr ? "علاج طبيعي" : "Physiotherapy",
    specCompanion: isAr ? "مرافق طبي متمرس" : "Companionship Companion",
    rateLabel: isAr ? "سعر الساعة (ج.م)" : "Hourly Rate (EGP)",
    ratePlaceholder: isAr ? "مثال: 150" : "e.g. 150",
    bioLabel: isAr ? "نبذة تعريفية عنك / سيرة ذاتية" : "Bio / About You",
    bioPlaceholder: isAr 
      ? "شاركنا خبرتك، شغفك بالرعاية، وما يجعلك مرافقاً رائعاً..." 
      : "Share your experience, passion for care, and what makes you a great companion...",
    back: isAr ? "رجوع" : "Back",
    next: isAr ? "الخطوة التالية" : "Next Step",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-6">
        {/* Companion Type */}
        <div className="space-y-2.5">
          <label className={`block text-xs font-bold uppercase tracking-wider text-gray-500 ${isAr ? "text-right" : "text-left"}`}>
            {labels.typeLabel}
          </label>
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
              <span className="text-sm font-bold block">{labels.generalTitle}</span>
              <span className="text-[10px] text-gray-400 font-semibold">{labels.generalDesc}</span>
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
              <span className="text-sm font-bold block">{labels.specialTitle}</span>
              <span className="text-[10px] text-gray-400 font-semibold">{labels.specialDesc}</span>
            </button>
          </div>
          {errors.companionType && <p className={`text-red-500 text-xs font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.companionType.message}</p>}
        </div>

        {/* Specialization (if specialized) */}
        {companionType === "specialized" && (
          <div className="space-y-1.5 animate-fade-in">
            <label className={`block text-sm font-bold text-gray-700 ${isAr ? "text-right" : "text-left"}`}>{labels.specialization}</label>
            <div className="relative">
              <Briefcase className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <select
                {...register("specialization")}
                className={`w-full py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium appearance-none ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
              >
                <option value="none">{labels.selectSpecialization}</option>
                <option value="nursing">{labels.specNursing}</option>
                <option value="physiotherapy">{labels.specPhysio}</option>
                <option value="companionship_companion">{labels.specCompanion}</option>
              </select>
            </div>
            {errors.specialization && <p className={`text-red-500 text-xs font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.specialization.message}</p>}
          </div>
        )}

        {/* Hourly Rate */}
        <div className="space-y-1.5">
          <label className={`block text-sm font-bold text-gray-700 ${isAr ? "text-right" : "text-left"}`}>{labels.rateLabel}</label>
          <div className="relative">
            <DollarSign className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              {...register("hourlyRate", { valueAsNumber: true })}
              type="number"
              className={`w-full py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
              placeholder={labels.ratePlaceholder}
            />
          </div>
          {errors.hourlyRate && <p className={`text-red-500 text-xs font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.hourlyRate.message}</p>}
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className={`block text-sm font-bold text-gray-700 ${isAr ? "text-right" : "text-left"}`}>{labels.bioLabel}</label>
          <div className="relative">
            <FileText className={`absolute ${isAr ? "right-4" : "left-4"} top-4 text-gray-400 w-5 h-5`} />
            <textarea
              {...register("bio")}
              rows={4}
              className={`w-full py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm leading-relaxed resize-none ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
              placeholder={labels.bioPlaceholder}
            />
          </div>
          {errors.bio && <p className={`text-red-500 text-xs font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.bio.message}</p>}
        </div>
      </div>

      <div className="pt-6 flex justify-between items-center border-t border-sand-high">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {labels.back}
        </button>
        <button
          type="submit"
          className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          {labels.next}
          {isAr ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </form>
  );
}
