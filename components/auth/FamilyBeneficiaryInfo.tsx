"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, User, Plus, Trash2 } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useLocale } from "next-intl";

export default function FamilyBeneficiaryInfo() {
  const { familyData, updateFamilyData, nextStep, prevStep } = useRegisterStore();
  const [isAdding, setIsAdding] = useState(familyData.beneficiaries.length === 0);
  const locale = useLocale();
  const isAr = locale === "ar";

  const beneficiarySchema = useMemo(() => z.object({
    name: z.string().min(1, isAr ? "اسم المستفيد مطلوب" : "Beneficiary name is required"),
    age: z.number({ invalid_type_error: isAr ? "يرجى إدخال عمر صحيح" : "Please enter a valid age" }).min(1, isAr ? "يرجى إدخال عمر صحيح" : "Please enter a valid age"),
    gender: z.enum(["male", "female"]),
    category: z.enum(["elderly", "special_needs"]),
    conditionDetails: z.string().min(10, isAr ? "يرجى كتابة تفاصيل الحالة (10 أحرف على الأقل)" : "Please provide some condition details (min 10 characters)"),
  }), [isAr]);

  type BeneficiaryData = z.infer<typeof beneficiarySchema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BeneficiaryData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      gender: "male",
      category: "elderly",
    },
  });

  const category = watch("category");
  const gender = watch("gender");

  const addBeneficiary = (data: BeneficiaryData) => {
    updateFamilyData({
      beneficiaries: [...familyData.beneficiaries, { ...data, interests: [] }],
    });
    setIsAdding(false);
    reset();
  };

  const removeBeneficiary = (index: number) => {
    const newList = [...familyData.beneficiaries];
    newList.splice(index, 1);
    updateFamilyData({ beneficiaries: newList });
    if (newList.length === 0) setIsAdding(true);
  };

  const labels = {
    ageText: isAr ? "سنة" : "years",
    elderly: isAr ? "كبير سن" : "Elderly",
    specialNeeds: isAr ? "ذوي احتياجات خاصة" : "Special Needs",
    nameLabel: isAr ? "الاسم" : "Name",
    namePlaceholder: isAr ? "الاسم الكامل للمستفيد" : "Full Name",
    ageLabel: isAr ? "العمر" : "Age",
    genderLabel: isAr ? "الجنس" : "Gender",
    male: isAr ? "ذكر" : "Male",
    female: isAr ? "أنثى" : "Female",
    categoryLabel: isAr ? "الفئة" : "Category",
    detailsLabel: isAr ? "تفاصيل الحالة الصحية" : "Condition Details",
    detailsPlaceholder: isAr 
      ? "صف الاحتياجات اليومية، القدرة على الحركة، أو الحالات الطبية..." 
      : "Describe daily needs, mobility, or medical conditions...",
    addBtn: isAr ? "إضافة مستفيد" : "Add Beneficiary",
    cancelBtn: isAr ? "إلغاء" : "Cancel",
    addAnotherBtn: isAr ? "إضافة مستفيد آخر" : "Add Another Beneficiary",
    back: isAr ? "رجوع" : "Back",
    next: isAr ? "الخطوة التالية" : "Next Step",
  };

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-3">
        {familyData.beneficiaries.map((b, idx) => (
          <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-sand-high rounded-2xl custom-shadow animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div className={isAr ? "text-right" : "text-left"}>
                <p className="text-sm font-bold text-gray-800">{b.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                  {b.age} {labels.ageText} • {b.category === 'elderly' ? labels.elderly : labels.specialNeeds}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeBeneficiary(idx)}
              className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {isAdding ? (
          <form onSubmit={handleSubmit(addBeneficiary)} className="bg-white rounded-3xl border border-sand-high p-4 space-y-3.5 animate-fade-in shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
                <label className="text-xs font-bold text-gray-700">{labels.nameLabel}</label>
                <input
                  {...register("name")}
                  className={`w-full px-4 py-2 bg-gray-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium ${isAr ? "text-right" : "text-left"}`}
                  placeholder={labels.namePlaceholder}
                />
                {errors.name && <p className={`text-red-500 text-[10px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.name.message}</p>}
              </div>

              <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
                <label className="text-xs font-bold text-gray-700">{labels.ageLabel}</label>
                <input
                  {...register("age", { valueAsNumber: true })}
                  type="number"
                  className={`w-full px-4 py-2 bg-gray-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium ${isAr ? "text-right" : "text-left"}`}
                  placeholder={labels.ageLabel}
                />
                {errors.age && <p className={`text-red-500 text-[10px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.age.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{labels.genderLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("gender", "male")}
                    className={`py-2 rounded-xl border-2 transition-all font-bold text-xs ${
                      gender === "male" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    {labels.male}
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("gender", "female")}
                    className={`py-2 rounded-xl border-2 transition-all font-bold text-xs ${
                      gender === "female" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    {labels.female}
                  </button>
                </div>
              </div>

              <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{labels.categoryLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("category", "elderly")}
                    className={`py-2 rounded-xl border-2 transition-all font-bold text-[10px] ${
                      category === "elderly" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    {labels.elderly}
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("category", "special_needs")}
                    className={`py-2 rounded-xl border-2 transition-all font-bold text-[10px] ${
                      category === "special_needs" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    {labels.specialNeeds}
                  </button>
                </div>
              </div>
            </div>

            <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
              <label className="text-xs font-bold text-gray-700">{labels.detailsLabel}</label>
              <textarea
                {...register("conditionDetails")}
                rows={2}
                className={`w-full px-4 py-2 bg-gray-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium resize-none leading-relaxed ${isAr ? "text-right" : "text-left"}`}
                placeholder={labels.detailsPlaceholder}
              />
              {errors.conditionDetails && <p className={`text-red-500 text-[10px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.conditionDetails.message}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {labels.addBtn}
              </button>
              {familyData.beneficiaries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer"
                >
                  {labels.cancelBtn}
                </button>
              )}
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-sm hover:border-primary hover:text-primary hover:bg-teal-50/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {labels.addAnotherBtn}
          </button>
        )}
      </div>

      <div className="pt-3 flex justify-between items-center border-t border-sand-high">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {labels.back}
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={familyData.beneficiaries.length === 0 || isAdding}
          className="group flex items-center justify-center gap-1.5 px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {labels.next}
          {isAr ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </div>
  );
}
